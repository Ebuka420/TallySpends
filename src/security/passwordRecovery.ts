import { API_URL } from "../api";

function requireSecureApi() {
  if (!API_URL?.startsWith("https://")) {
    throw new Error("Secure password recovery is unavailable. Please try again later.");
  }
}

export async function requestPasswordReset(email: string, signal: AbortSignal, send: typeof fetch = fetch) {
  requireSecureApi();
  const normalizedEmail = email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
    throw new Error("Enter the email address for your TallySpends account.");
  }

  let response: Response;
  try {
    response = await send(`${API_URL}/api/auth/forgot-password`, {
      method: "POST", signal, redirect: "error",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ email: normalizedEmail }),
    });
  } catch (error) {
    if (signal.aborted) throw error;
    throw new Error("Couldn't connect to password recovery. Check your connection and try again.");
  }
  if (!response.ok) throw new Error(response.status === 429
    ? "Too many requests. Please wait a little and try again."
    : "We couldn't send a reset code right now. Please try again later.");
}

export async function resetPassword(email: string, code: string, newPassword: string, signal: AbortSignal, send: typeof fetch = fetch) {
  requireSecureApi();
  const normalizedEmail = email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) throw new Error("Enter a valid account email.");
  if (!/^\d{6}$/.test(code)) throw new Error("Enter the six-digit reset code.");
  if (newPassword.length < 6) throw new Error("Your new password must be at least 6 characters.");

  let response: Response;
  try {
    response = await send(`${API_URL}/api/auth/reset-password`, {
      method: "POST", signal, redirect: "error",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ email: normalizedEmail, code, newPassword }),
    });
  } catch (error) {
    if (signal.aborted) throw error;
    throw new Error("Couldn't connect to password recovery. Check your connection and try again.");
  }
  if (!response.ok) throw new Error(response.status === 400
    ? "That code is incorrect or expired. Request a new code and try again."
    : response.status === 429
      ? "Too many attempts. Please wait before trying again."
      : "We couldn't reset your password right now. Please try again later.");
}
