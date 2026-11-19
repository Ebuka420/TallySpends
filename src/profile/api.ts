import { API_URL } from "../api";
import { fetch as expoFetch } from "expo/fetch";
import { refreshSession, expireSession, SessionExpiredError, sessionHasExpired } from "../session";
export type ProfileSession = { token: string | null; refreshToken: string | null; saveTokens: (token: string, refresh: string) => Promise<void> };
export function createProfileRequest(session: ProfileSession, signal: AbortSignal, send: typeof fetch = expoFetch) {
  let token = session.token;
  let refreshed = false;
  return async (path: "/api/users/me" | "/api/users/me/avatar", init: RequestInit = {}) => {
    if (!API_URL.startsWith("https://")) throw new Error("Profile services require a secure connection.");
    if (sessionHasExpired()) throw new SessionExpiredError();
    const renew = async () => {
      if (refreshed || !session.refreshToken) { await expireSession(); throw new SessionExpiredError(); }
      refreshed = true;
      const next = await refreshSession(session.refreshToken, signal, send);
      token = next.token;
      await session.saveTokens(next.token, next.refreshToken);
    };
    if (!token) await renew();
    const request = () => {
      const headers = new Headers(init.headers);
      headers.set("Authorization", "Bearer " + token);
      headers.set("Accept", "application/json");
      // Let fetch set the multipart boundary for uploaded photos.
      return send(API_URL + path, { ...init, headers, signal, redirect: "error" });
    };
    let response;
    try {
      response = await request();
      if (response.status === 401) { await renew(); response = await request(); }
      if (response.status === 401) { await expireSession(); throw new SessionExpiredError(); }
    } catch (error) {
      if (error instanceof SessionExpiredError) throw error;
      if (signal.aborted) throw new Error("The profile request timed out or was cancelled. Please try again.");
      if (error instanceof Error && /Unsupported FormData|FormDataPart/.test(error.message)) throw new Error("The selected photo couldn't be prepared for upload. Please choose it again.");
      if (path === "/api/users/me/avatar") throw new Error("Photo upload couldn't be confirmed. Refresh your profile before retrying. Check your connection if the profile also fails to load.");
      throw new Error("Couldn't connect to profile services. Check your connection and try again.");
    }
    if (response.status !== 200) throw new Error(response.status === 401 ? "Your session has expired. Sign in again." : response.status === 413 ? "This photo is too large. Choose a smaller image." : response.status === 415 ? "The server doesn't accept this photo format. Try a JPEG or PNG image." : response.status >= 500 ? "Profile services are temporarily unavailable. Please try again later." : response.status === 400 ? "The server couldn't accept this profile change. Check the details and try again." : "Couldn't save or load your profile. Please try again.");
    const value = await response.json().catch(() => null);
    if (value?.success === false || ["pending", "failed", "error"].includes(String(value?.status || "").toLowerCase())) throw new Error("The backend hasn't confirmed this profile request. Please try again later.");
    return value as unknown;
  };
}
