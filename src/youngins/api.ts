import { API_URL } from "../api";
import { parseList, parseReceipt, validateDraft, type PrivacyNotice, type YounginsDraft, type YounginsProfile } from "./model";
import { requireYounginsReadiness } from "./readiness";

export type YounginsSession = { token: string | null; refreshToken: string | null; saveTokens: (token: string, refreshToken: string) => Promise<void> };
export type YounginsRequest = (path: string, init?: RequestInit) => Promise<unknown>;
export function createSubmissionGate() {
  let busy = false;
  let completed = false;
  return {
    get busy() { return busy; },
    get completed() { return completed; },
    async run<T>(action: () => Promise<T>, onBusy: (busy: boolean) => void): Promise<T | null> {
      if (busy || completed) return null;
      busy = true;
      onBusy(true);
      try { const result = await action(); completed = true; return result; }
      finally { busy = false; onBusy(false); }
    },
  };
}
// Backend confirms only POST/GET /api/children. No detail or update endpoint.
export function createYounginsRequest(session: YounginsSession, signal: AbortSignal, send: typeof fetch = fetch): YounginsRequest {
  let token = session.token;
  let refreshed = false;
  async function refresh() {
    if (refreshed || !session.refreshToken) return false;
    refreshed = true;
    const response = await send(API_URL + "/api/auth/refresh", {
      method: "POST", headers: { "Content-Type": "application/json" }, signal,
      body: JSON.stringify({ refreshToken: session.refreshToken }),
    });
    if (!response.ok) return false;
    const data = await response.json();
    const accessToken = data?.accessToken || data?.token;
    if (typeof accessToken !== "string" || !accessToken.trim()) return false;
    token = accessToken;
    await session.saveTokens(accessToken, typeof data.refreshToken === "string" ? data.refreshToken : session.refreshToken);
    return true;
  }
  return async (path, init = {}) => {
    const method = (init.method ?? "GET").toUpperCase();
    const allowed = path === "/api/children" && (method === "GET" || method === "POST");
    if (!API_URL.startsWith("https://") || !allowed || path.includes("\\") || path.includes("://") || path.includes("..")) {
      throw new Error("Youngins requires a secure connection to the TallySpends backend.");
    }
    if (!token && !(await refresh())) throw new Error("Sign in to your guardian account to continue.");
    const request = () => {
      const headers = new Headers(init.headers);
      headers.set("Authorization", "Bearer " + token);
      headers.set("Content-Type", "application/json");
      headers.set("Accept", "application/json");
      return send(API_URL + path, { ...init, headers, signal, cache: "no-store", redirect: "error" });
    };
    let response;
    try {
      response = await request();
      if (response.status === 401 && await refresh()) response = await request();
    } catch {
      throw new Error(init.method === "POST" || init.method === "PATCH"
        ? "Couldn't confirm the request. Check your Youngins profiles before submitting again."
        : "Couldn't connect to Youngins. Check your connection and try again.");
    }
    if (!response.ok) {
      // Never show raw server messages: validation errors can echo sensitive NIN.
      throw new Error(response.status === 401 ? "Your session has expired. Sign in again to continue."
        : response.status === 403 ? "You are not authorized to manage this Youngins profile."
        : response.status === 404 || response.status === 503 ? "Youngins registration is not available yet. Please try again later."
        : response.status === 409 ? "This child could not be registered. Check your details or contact support."
        : response.status === 400 || response.status === 422 ? "The server couldn't accept these details. Check all five fields and try again."
        : response.status === 429 ? "Too many requests. Please wait a moment before trying again."
        : "Couldn't complete the request. Check your Youngins profiles before submitting again.");
    }
    if (!(response.status === 200 || method === "POST" && response.status === 201)) throw new Error("The Youngins profile has not been confirmed. Please refresh your profiles.");
    try { return await response.json(); }
    catch { throw new Error("Couldn't confirm the Youngins profile. Please refresh your profiles."); }
  };
}
export type YounginsConsent = { accepted: boolean; noticeVersion: string };
// Builds the confirmed request contract without sending or persisting child data.
export function buildYounginsRegistration(draft: YounginsDraft, notice: PrivacyNotice, consent: YounginsConsent, _key: string): RequestInit {
  if (Object.keys(validateDraft(draft)).length) throw new Error("Check the highlighted fields before creating this account.");
  if (!notice.ninCollectionEnabled || !notice.version.trim() || notice.version.length > 20 || consent.accepted !== true || consent.noticeVersion !== notice.version) throw new Error("Review and accept the current privacy notice before continuing.");
  return {
    // Backend deduplicates the same child per guardian; no idempotency-header
    // contract was supplied. Consent version is exactly what was accepted.
    method: "POST",
    body: JSON.stringify({ firstName: draft.firstName.trim(), lastName: draft.lastName.trim(),
      dateOfBirth: draft.dateOfBirth, guardianRelationship: draft.guardianRelationship, nin: draft.nin,
      consent: { accepted: consent.accepted, noticeVersion: consent.noticeVersion } }),
  };
}
export const younginsApi = {
  // No privacy endpoint is documented. Keep the existing consent UI but fail
  // before collecting child details until release prerequisites are confirmed.
  notice: async (_request: YounginsRequest) => requireYounginsReadiness(),
  list: async (request: YounginsRequest): Promise<YounginsProfile[]> => {
    const response = await request("/api/children");
    try { return parseList(response); }
    catch { throw new Error("The backend returned an invalid Youngins accounts response. Refresh your accounts or contact support."); }
  },
  async get(id: string, request: YounginsRequest): Promise<YounginsProfile> {
    // Swagger exposes only collection reads; use the guardian's refreshed list.
    const profile = (await younginsApi.list(request)).find(profile => profile.id === id);
    if (!profile) throw new Error("We couldn't confirm the selected Youngins profile. Please refresh your profiles.");
    return profile;
  },
  async create(draft: YounginsDraft, notice: PrivacyNotice, consent: YounginsConsent, key: string, request: YounginsRequest) {
    const approvedNotice = requireYounginsReadiness();
    if (notice.version !== approvedNotice.version) throw new Error("Review and accept the current privacy notice before continuing.");
    const response = await request("/api/children", buildYounginsRegistration(draft, approvedNotice, consent, key));
    try { return parseReceipt(response); }
    catch { throw new Error("The backend returned an unrecognized registration response. Check your Youngins accounts before trying again; the response contract must be confirmed."); }
  },
  async update(_id: string, _draft: YounginsDraft, _key: string, _request: YounginsRequest): Promise<YounginsProfile> {
    throw new Error("Editing child profiles is not supported by the backend yet. Your details have not been changed.");
  },
};
