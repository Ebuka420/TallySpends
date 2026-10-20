import { API_URL } from "../api";
import { parseIdentity, parseRecipient, validPaymentId } from "./model";
export type QrSession = { token: string | null; refreshToken: string | null; saveTokens: (token: string, refresh: string) => Promise<void> };
export type QrRequest = (path: string) => Promise<unknown>;
export function createQrRequest(session: QrSession, signal: AbortSignal, send: typeof fetch = fetch): QrRequest {
  let token = session.token;
  let refreshed = false;
  async function refresh() {
    if (refreshed || !session.refreshToken) return false;
    refreshed = true;
    const response = await send(API_URL + "/api/auth/refresh", { method: "POST", signal,
      headers: { "Content-Type": "application/json" }, body: JSON.stringify({ refreshToken: session.refreshToken }) });
    if (!response.ok) return false;
    const value = await response.json();
    const accessToken = value?.accessToken || value?.token;
    if (typeof accessToken !== "string" || !accessToken.trim()) return false;
    token = accessToken;
    await session.saveTokens(token, typeof value.refreshToken === "string" ? value.refreshToken : session.refreshToken);
    return true;
  }
  return async path => {
    if (!API_URL.startsWith("https://") || !(path === "/api/users/me" || path.startsWith("/api/payments/recipients/") && validPaymentId(path.slice("/api/payments/recipients/".length)))) throw new Error("QR services require a secure TallySpends connection.");
    if (!token && !(await refresh())) throw new Error("Sign in to use payment QR codes.");
    const request = () => send(API_URL + path, { signal, headers: { Authorization: "Bearer " + token, Accept: "application/json" }, redirect: "error" });
    let response;
    try { response = await request(); if (response.status === 401 && await refresh()) response = await request(); }
    catch { throw new Error("Couldn't connect to QR services. Check your connection and try again."); }
    if (!response.ok) throw new Error(response.status === 401 ? "Your session has expired. Sign in again."
      : response.status === 404 || response.status === 503 ? "QR recipient lookup is not available yet. Please try again later."
      : response.status === 403 ? "This recipient is not available to your account."
      : response.status === 429 ? "Too many QR requests. Please wait and try again."
      : "Couldn't verify the QR details. Please try again.");
    if (response.status !== 200) throw new Error("The QR details are not confirmed yet. Please try again later.");
    try { return await response.json(); } catch { throw new Error("Couldn't read the QR details. Please try again."); }
  };
}
// Profile endpoint exists; new publicPaymentId field and recipient endpoint are awaiting backend agreement.
export const qrApi = {
  identity: async (request: QrRequest) => parseIdentity(await request("/api/users/me")),
  async recipient(paymentId: string, request: QrRequest) {
    if (!validPaymentId(paymentId)) throw new Error("Invalid payment ID.");
    return parseRecipient(await request("/api/payments/recipients/" + paymentId), paymentId);
  },
};
