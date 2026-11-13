import { API_URL } from "../api";
import { profileScope } from "../profile/model";
export async function verifyAccountPassword(owner: string, identifier: string, password: string, signal: AbortSignal, send: typeof fetch = fetch) {
  if (!API_URL.startsWith("https://")) throw new Error("Secure account verification is unavailable.");
  if (!password || !identifier) throw new Error("Enter your account password.");
  const response = await send(API_URL + "/api/auth/login", { method: "POST", signal, redirect: "error",
    headers: { "Content-Type": "application/json" }, body: JSON.stringify({ emailOrTallyTag: identifier, password }) });
  if (!response.ok) throw new Error(response.status === 429 ? "Too many attempts. Please wait before trying again." : response.status === 401 || response.status === 400 ? "Your password could not be verified." : "Couldn't verify your password. Please try again.");
  const data = await response.json().catch(() => null);
  const scope = profileScope(data ? owner.startsWith("email:") ? { email: data.email } : { userId: data.userId, email: data.email } : null);
  const token = data?.accessToken || data?.token;
  if (scope !== owner || typeof token !== "string" || !token.trim()) throw new Error("The server couldn't verify this account. Your PIN has not changed.");
  return { token, refreshToken: typeof data.refreshToken === "string" ? data.refreshToken : null };
}
export async function changePassword(token: string, currentPassword: string, newPassword: string, signal: AbortSignal, send: typeof fetch = fetch,
  session?: { refreshToken: string | null; saveTokens: (access: string, refresh: string) => Promise<void> }) {
  if (!API_URL.startsWith("https://")) throw new Error("Secure password changes are unavailable.");
  const request = () => send(API_URL + "/api/auth/change-password", { method: "POST", signal, redirect: "error",
    headers: { "Content-Type": "application/json", Authorization: "Bearer " + token }, body: JSON.stringify({ currentPassword, newPassword }) });
  let response = await request();
  if (response.status === 401 && session?.refreshToken) {
    const refreshed = await send(API_URL + "/api/auth/refresh", { method: "POST", signal, redirect: "error", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ refreshToken: session.refreshToken }) });
    const data = refreshed.ok ? await refreshed.json().catch(() => null) : null;
    const next = data?.accessToken || data?.token;
    if (typeof next === "string" && next.trim()) {
      token = next; await session.saveTokens(token, typeof data.refreshToken === "string" ? data.refreshToken : session.refreshToken);
      response = await request();
    }
  }
  if (!response.ok) throw new Error(response.status === 401 ? "Your session expired or your current password is incorrect. Sign in and try again."
    : response.status === 400 ? "The server rejected the password change. Check your current password and use a stronger new password."
    : response.status === 429 ? "Too many requests. Please wait and try again." : "Couldn't change your password. Please try again.");
  if (![200, 204].includes(response.status)) throw new Error("The server hasn't confirmed the password change. Please check before retrying.");
}
