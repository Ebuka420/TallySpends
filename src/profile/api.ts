import { API_URL } from "../api";
import { fetch as expoFetch } from "expo/fetch";
export type ProfileSession = { token: string | null; refreshToken: string | null; saveTokens: (token: string, refresh: string) => Promise<void> };
export function createProfileRequest(session: ProfileSession, signal: AbortSignal, send: typeof fetch = expoFetch) {
  let token = session.token;
  let refreshed = false;
  return async (path: "/api/users/me" | "/api/users/me/avatar", init: RequestInit = {}) => {
    if (!API_URL.startsWith("https://") || !token) throw new Error("Sign in again to update your profile.");
    const request = () => {
      const headers = new Headers(init.headers);
      headers.set("Authorization", "Bearer " + token);
      headers.set("Accept", "application/json");
      // Let fetch set the multipart boundary for uploaded photos.
      return send(API_URL + path, { ...init, headers, signal, redirect: "error" });
    };
    let response;
    let refreshing = false;
    try {
      response = await request();
      if (response.status === 401 && !refreshed && session.refreshToken) {
        refreshed = true;
        refreshing = true;
        const refresh = await send(API_URL + "/api/auth/refresh", { method: "POST", signal, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ refreshToken: session.refreshToken }), redirect: "error" });
        const value = refresh.ok ? await refresh.json().catch(() => null) : null;
        const next = value?.accessToken || value?.token;
        if (typeof next === "string" && next.trim()) { token = next; await session.saveTokens(next, value.refreshToken || session.refreshToken); refreshing = false; response = await request(); }
      }
    } catch (error) {
      if (signal.aborted) throw new Error("The profile request timed out or was cancelled. Please try again.");
      if (error instanceof Error && /Unsupported FormData|FormDataPart/.test(error.message)) throw new Error("The selected photo couldn't be prepared for upload. Please choose it again.");
      if (refreshing) throw new Error("Couldn't refresh your profile session. Please sign in again and retry.");
      if (path === "/api/users/me/avatar") throw new Error("Photo upload couldn't be confirmed. Refresh your profile before retrying. Check your connection if the profile also fails to load.");
      throw new Error("Couldn't connect to profile services. Check your connection and try again.");
    }
    if (response.status !== 200) throw new Error(response.status === 401 ? "Your session has expired. Sign in again." : response.status === 413 ? "This photo is too large. Choose a smaller image." : response.status === 415 ? "The server doesn't accept this photo format. Try a JPEG or PNG image." : response.status >= 500 ? "Profile services are temporarily unavailable. Please try again later." : response.status === 400 ? "The server couldn't accept this profile change. Check the details and try again." : "Couldn't save or load your profile. Please try again.");
    const value = await response.json().catch(() => null);
    if (value?.success === false || ["pending", "failed", "error"].includes(String(value?.status || "").toLowerCase())) throw new Error("The backend hasn't confirmed this profile request. Please try again later.");
    return value as unknown;
  };
}
