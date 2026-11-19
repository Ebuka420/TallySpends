import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_URL } from "./api";

export type SessionTokens = { token: string; refreshToken: string };
export class SessionExpiredError extends Error {
  constructor() { super("Your session has expired. Sign in again."); this.name = "SessionExpiredError"; }
}
let generation = 0;
let expired = false;
const listeners = new Set<() => void>();
const pending = new Map<string, { controller: AbortController; promise: Promise<SessionTokens> }>();
const rotated = new Map<string, SessionTokens>();
let clearing: Promise<void> = Promise.resolve();
let storageQueue: Promise<void> = Promise.resolve();
let latest: SessionTokens | null = null;
function writeStorage(action: () => Promise<void>) {
  const task = storageQueue.catch(() => {}).then(action);
  storageQueue = task.catch(() => {});
  return task;
}
export function latestSessionTokens(tokens: SessionTokens): SessionTokens {
  return latest && (latest.refreshToken === tokens.refreshToken || rotated.has(tokens.refreshToken)) ? latest : tokens;
}
export async function saveSessionTokens(tokens: SessionTokens) {
  const started = generation;
  const resolved = latestSessionTokens(tokens);
  await writeStorage(async () => {
    if (started !== generation || expired) throw new SessionExpiredError();
    const current = latestSessionTokens(resolved);
    await AsyncStorage.multiSet([["ts_access_token", current.token], ["ts_refresh_token", current.refreshToken]]);
  });
  if (started !== generation || expired) throw new SessionExpiredError();
  latest = latestSessionTokens(resolved);
  return latest;
}
// Login/password verification also rotates the single-use refresh token.
export async function replaceSessionTokens(tokens: SessionTokens) {
  const old = latest;
  generation++; pending.forEach(job => job.controller.abort()); pending.clear();
  if (old) rotated.set(old.refreshToken, tokens);
  latest = tokens;
  return saveSessionTokens(tokens);
}
export const sessionHasExpired = () => expired;
export function subscribeSessionExpired(listener: () => void) { listeners.add(listener); return () => { listeners.delete(listener); }; }
export async function beginSession() {
  await clearing;
  generation++;
  pending.forEach(job => job.controller.abort()); pending.clear(); rotated.clear();
  expired = false;
  latest = null;
}
export function expireSession(): Promise<void> {
  if (expired) return clearing;
  expired = true; generation++;
  pending.forEach(job => job.controller.abort()); pending.clear(); rotated.clear();
  latest = null;
  // Publish synchronously so protected routes and background callers stop now.
  listeners.forEach(listener => listener());
  clearing = writeStorage(() => AsyncStorage.multiRemove(["ts_access_token", "ts_refresh_token", "ts_user"]));
  return clearing;
}
function cancelled() { return new Error("The session request was cancelled."); }
function waitFor<T>(promise: Promise<T>, signal: AbortSignal): Promise<T> {
  if (signal.aborted) { void promise.catch(() => {}); return Promise.reject(cancelled()); }
  return new Promise((resolve, reject) => {
    const abort = () => { signal.removeEventListener("abort", abort); reject(cancelled()); };
    signal.addEventListener("abort", abort, { once: true });
    promise.then(value => { signal.removeEventListener("abort", abort); if (signal.aborted) reject(cancelled()); else resolve(value); }, error => { signal.removeEventListener("abort", abort); reject(error); });
  });
}

// Refresh tokens are single use. Every feature must share this coordinator.
// The request has its own timeout: closing one screen must not cancel renewal
// for all the other requests waiting for the same session.
export async function refreshSession(refreshToken: string, signal: AbortSignal, send: typeof fetch = fetch): Promise<SessionTokens> {
  if (signal.aborted) throw cancelled();
  if (expired || !refreshToken) throw new SessionExpiredError();
  if (!API_URL.startsWith("https://")) throw new Error("A secure session connection is required.");
  const started = generation;
  let cached = rotated.get(refreshToken);
  if (cached) {
    // Follow rotations so a delayed request cannot restore an older token pair.
    const visited = new Set<string>();
    while (rotated.has(cached.refreshToken) && !visited.has(cached.refreshToken)) {
      visited.add(cached.refreshToken); cached = rotated.get(cached.refreshToken)!;
    }
    const current = latestSessionTokens(cached);
    if (pending.has(current.refreshToken)) return refreshSession(current.refreshToken, signal, send);
    return current;
  }
  let job = pending.get(refreshToken);
  if (!job) {
    const controller = new AbortController();
    const promise = (async () => {
      const timer = setTimeout(() => controller.abort(), 20000);
      try {
        const response = await send(API_URL + "/api/auth/refresh", { method: "POST", signal: controller.signal,
          redirect: "error", cache: "no-store", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ refreshToken }) });
        if (started !== generation) throw cancelled();
        if (response.status === 401) { await expireSession(); throw new SessionExpiredError(); }
        if (response.status !== 200) throw new Error("Couldn't renew your session right now. Please try again.");
        const data = await response.json().catch(() => null);
        const token = data?.accessToken || data?.token;
        if (typeof token !== "string" || !token.trim() || typeof data?.refreshToken !== "string" || !data.refreshToken.trim()) {
          throw new Error("The session service returned an incomplete response. Please try again.");
        }
        if (started !== generation || expired) throw cancelled();
        const result = { token, refreshToken: data.refreshToken };
        // Save the pair before any waiting caller retries its authenticated request.
        await saveSessionTokens(result);
        if (started !== generation || expired) {
          if (expired) await clearing;
          throw cancelled();
        }
        rotated.set(refreshToken, result);
        latest = result;
        return result;
      } catch (error) {
        if (error instanceof SessionExpiredError) throw error;
        if (started !== generation) throw cancelled();
        throw new Error("Couldn't renew your session right now. Check your connection and retry.");
      } finally { clearTimeout(timer); if (started === generation) pending.delete(refreshToken); }
    })();
    job = { controller, promise }; pending.set(refreshToken, job);
  }
  const result = await waitFor(job.promise, signal);
  if (started !== generation || expired) throw new SessionExpiredError();
  return result;
}
