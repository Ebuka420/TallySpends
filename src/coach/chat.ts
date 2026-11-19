import { API_URL } from "../api";
import { refreshSession, sessionHasExpired, SessionExpiredError } from "../session";

export class CoachRequestError extends Error {
  requiresSignIn: boolean;
  constructor(message: string, requiresSignIn = false) {
    super(message);
    this.requiresSignIn = requiresSignIn;
  }
}

export async function requestCoachReply(
  question: string,
  token: string | null,
  signal: AbortSignal,
  send: typeof fetch = fetch,
  session?: {
    refreshToken: string | null;
    saveTokens: (accessToken: string, refreshToken: string) => Promise<void>;
  },
): Promise<string> {
  if (sessionHasExpired()) throw new SessionExpiredError();
  let refreshAttempted = false;
  const refresh = async () => {
    if (refreshAttempted) return null;
    refreshAttempted = true;
    if (!session?.refreshToken) return null;
    const next = await refreshSession(session.refreshToken, signal, send);
    await session.saveTokens(next.token, next.refreshToken);
    return next.token;
  };
  if (!token) token = await refresh();
  if (!token)
    throw new CoachRequestError(
      "Sign in again to chat with your coach. Your question is kept here.",
      true,
    );

  const chat = (accessToken: string) => send(
    `${API_URL}/api/chat`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ message: question }),
      signal,
    },
  );
  let response = await chat(token);
  if (response.status === 401) {
    const refreshedToken = await refresh();
    if (refreshedToken) response = await chat(refreshedToken);
  }

  if (!response.ok)
    throw new CoachRequestError(
      response.status === 401
        ? "Your session has expired. Sign in again to continue."
        : "Your coach couldn't connect. Try sending your question again.",
      response.status === 401,
    );
  const data = await response.json().catch(() => {
    throw new CoachRequestError(
      "Your coach couldn't finish that reply. Please try again.",
    );
  });
  const answer = data?.assistantMessage?.content;
  if (typeof answer !== "string" || !answer.trim())
    throw new CoachRequestError(
      "Your coach couldn't finish that reply. Please try again.",
    );
  return answer.trim();
}
