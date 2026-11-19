import { API_URL } from "../api";
import { refreshSession, sessionHasExpired, SessionExpiredError } from "../session";
import { normalizePaymentId, parseIdentity, parseRecipient, validPaymentId } from "./model";
export type QrSession = { token: string | null; refreshToken: string | null; saveTokens: (token: string, refresh: string) => Promise<void> };
export type QrRequest = (path: string) => Promise<unknown>;
export function createQrRequest(session: QrSession, signal: AbortSignal, send: typeof fetch = fetch): QrRequest {
  let token = session.token;
  let refreshed = false;
  async function refresh() {
    if (refreshed || !session.refreshToken) return false;
    refreshed = true;
    const next = await refreshSession(session.refreshToken, signal, send);
    token = next.token;
    await session.saveTokens(next.token, next.refreshToken);
    return true;
  }
  return async path => {
    if (sessionHasExpired()) throw new SessionExpiredError();
    if (!API_URL.startsWith("https://") || !(path === "/api/users/me" || path.startsWith("/api/payment-ids/") && validPaymentId(path.slice("/api/payment-ids/".length))
      || /^\/api\/payment-ids\/by-tag\/[A-Za-z0-9_]{6,64}$/.test(path))) throw new Error("QR services require a secure TallySpends connection.");
    if (!token && !(await refresh())) throw new Error("Sign in to use payment QR codes.");
    const request = () => send(API_URL + path, { signal, headers: { Authorization: "Bearer " + token, Accept: "application/json" }, redirect: "error" });
    let response;
    try { response = await request(); if (response.status === 401 && await refresh()) response = await request(); }
    catch { throw new Error("Couldn't connect to QR services. Check your connection and try again."); }
    if (!response.ok) throw new Error(response.status === 401 ? "Your session has expired. Sign in again."
      : response.status === 404 ? "No user was found with those details. Check the TallyTag or payment ID."
      : response.status === 503 ? "Recipient lookup is temporarily unavailable. Please try again later."
      : response.status === 403 ? "This recipient is not available to your account."
      : response.status === 409 ? "That username matches multiple accounts. Ask for their payment ID instead."
      : response.status === 429 ? "Too many QR requests. Please wait and try again."
      : "Couldn't verify the QR details. Please try again.");
    if (response.status !== 200) throw new Error("The QR details are not confirmed yet. Please try again later.");
    try { return await response.json(); } catch { throw new Error("Couldn't read the QR details. Please try again."); }
  };
}
// The frontend contract returns an exact match with an explicit self-payment flag.
export const qrApi = {
  identity: async (request: QrRequest) => parseIdentity(await request("/api/users/me")),
  async recipient(paymentId: string, request: QrRequest) {
    paymentId = normalizePaymentId(paymentId);
    return parseRecipient(await request("/api/payment-ids/" + paymentId), paymentId);
  },
  async byTag(tag: string, request: QrRequest) {
    const clean = tag.trim().replace(/^@/, "");
    if (!/^[A-Za-z0-9_]{6,64}$/.test(clean)) throw new Error("Enter a complete TallyTag using at least 6 letters, numbers or underscores.");
    const recipient = parseRecipient(await request("/api/payment-ids/by-tag/" + clean));
    if (recipient.tallyTag.toLowerCase() !== clean.toLowerCase()) throw new Error("The returned recipient did not match that TallyTag.");
    return recipient;
  },
};
