import { API_URL } from "./api";
import { expireSession, refreshSession, SessionExpiredError, sessionHasExpired } from "./session";
export type ApiSession = { token: string | null; refreshToken: string | null; saveTokens: (token: string, refresh: string) => Promise<void> };
export type ApiResponse = { status: number; data: unknown };
export type ApiRequest = (path: string, init?: RequestInit) => Promise<ApiResponse>;
export function createApiRequest(session: ApiSession, signal: AbortSignal, send: typeof fetch = fetch): ApiRequest {
  let token = session.token;
  let refreshToken = session.refreshToken;
  return async (path, init = {}) => {
    if (!API_URL.startsWith("https://") || !path.startsWith("/api/") || /[\\]|\.\.|:\/\//.test(path)) throw new Error("Invalid API route.");
    if (sessionHasExpired()) throw new SessionExpiredError();
    let renewed = false;
    const renew = async () => {
      if (renewed || !refreshToken) { await expireSession(); throw new SessionExpiredError(); }
      renewed = true;
      const next = await refreshSession(refreshToken, signal, send);
      token = next.token; refreshToken = next.refreshToken;
      await session.saveTokens(token, refreshToken);
    };
    if (!token) await renew();
    const sendRequest = () => {
      if (signal.aborted || sessionHasExpired()) throw new Error("Request cancelled. Check its status before trying again.");
      const headers = new Headers(init.headers);
      headers.set("Authorization", "Bearer " + token); headers.set("Accept", "application/json");
      if (typeof init.body === "string") headers.set("Content-Type", "application/json");
      return send(API_URL + path, { ...init, headers, signal, redirect: "error", cache: "no-store" });
    };
    let response: Response;
    try {
      response = await sendRequest();
      if (response.status === 401) { await renew(); response = await sendRequest(); }
    } catch (error) {
      if (error instanceof SessionExpiredError) throw error;
      throw new Error("Couldn't confirm the request. Check your connection and try again.");
    }
    if (response.status === 401) { await expireSession(); throw new SessionExpiredError(); }
    const data = response.status === 204 ? null : await response.json().catch(() => null);
    return { status: response.status, data };
  };
}
