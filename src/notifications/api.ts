import { API_URL } from "../api";
import { refreshSession, sessionHasExpired, SessionExpiredError } from "../session";

export type NotificationSession = {
  token: string | null;
  refreshToken: string | null;
  saveTokens: (token: string, refreshToken: string) => Promise<void>;
};

// RegisterDeviceTokenRequest has exactly one field. The documented response is
// HTTP 200 without a body schema; registration is not proof of push delivery.
export async function registerPushToken(
  expoPushToken: string, session: NotificationSession, signal: AbortSignal,
  send: typeof fetch = fetch,
): Promise<void> {
  if (sessionHasExpired()) throw new SessionExpiredError();
  if (!API_URL.startsWith("https://") || !/^(ExponentPushToken|ExpoPushToken)\[[^\]\s]+\]$/.test(expoPushToken)) {
    throw new Error("Push registration requires a valid Expo token and secure connection.");
  }
  let token = session.token;
  let refreshed = false;
  const checkCancelled = () => {
    if (signal.aborted) throw new Error("Push registration was cancelled.");
  };
  async function refresh() {
    if (refreshed || !session.refreshToken) return false;
    refreshed = true;
    checkCancelled();
    const next = await refreshSession(session.refreshToken, signal, send);
    checkCancelled();
    await session.saveTokens(next.token, next.refreshToken);
    token = next.token;
    return true;
  }
  if (!token && !(await refresh())) throw new Error("Sign in to enable push notifications.");
  const request = () => {
    checkCancelled();
    return send(API_URL + "/api/notifications/register-token", {
      method: "POST", signal, redirect: "error", cache: "no-store",
      headers: { Authorization: "Bearer " + token, "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ expoPushToken }),
    });
  };
  let response = await request();
  if (response.status === 401 && await refresh()) response = await request();
  checkCancelled();
  if (response.status !== 200) throw new Error(response.status === 401
    ? "Sign in again to enable push notifications."
    : "Push registration couldn't be confirmed. It will retry when the app is active.");
  const value = await response.json().catch(() => null);
  if (value?.success === false || ["pending", "processing", "failed", "error"].includes(String(value?.status || "").toLowerCase())) {
    throw new Error("Push registration couldn't be confirmed.");
  }
}
