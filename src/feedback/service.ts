import { API_URL } from "../api";
import { refreshSession, sessionHasExpired, SessionExpiredError } from "../session";

export const FEEDBACK_TAGS = [
  "Budgeting Tools", "Expense Tracking", "Ajo Circles", "User Interface",
  "App Performance", "Customer Support",
];
export type FeedbackDraft = { rating: number; tags: string[]; suggestions: string };
export type FeedbackPayload = { rating: number; categories: string[]; suggestions: string };
// Swagger confirms HTTP 200, but no storage/email receipt schema.
export type FeedbackReceipt = { accepted: true };
type Session = {
  token: string | null;
  refreshToken: string | null;
  saveTokens: (token: string, refreshToken: string) => Promise<void>;
};

export function canSubmitFeedback(draft: FeedbackDraft) {
  return Number.isInteger(draft.rating) && draft.rating >= 1 && draft.rating <= 5;
}

export function toggleFeedbackTag(tags: string[], tag: string) {
  return tags.includes(tag) ? tags.filter(value => value !== tag) : [...tags, tag];
}

// Own the synchronous submission lock and keep the same key when
// retrying an unchanged draft after a timeout or ambiguous network outcome.
export function createFeedbackSubmission() {
  let busy = false;
  let completed = false;
  let previousSignature = "";
  let key = "";
  let payload: FeedbackPayload;
  return {
    async run(draft: FeedbackDraft,
      send: (payload: FeedbackPayload, key: string) => Promise<FeedbackReceipt>,
      onBusy: (value: boolean) => void): Promise<FeedbackReceipt | null> {
      if (busy || completed) return null;
      if (!canSubmitFeedback(draft)) {
        throw new Error("Select a star rating from 1 to 5 before submitting.");
      }
      if (draft.tags.some(tag => !FEEDBACK_TAGS.includes(tag))) throw new Error("Please select one of the available improvement categories.");
      const signature = JSON.stringify({ ...draft, tags: [...draft.tags].sort() });
      if (signature !== previousSignature) {
        previousSignature = signature;
        key = `feedback-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`;
        payload = { rating: draft.rating, categories: [...draft.tags], suggestions: draft.suggestions };
      }
      busy = true;
      onBusy(true);
      try {
        const result = await send(payload, key);
        completed = true;
        return result;
      } finally {
        busy = false;
        onBusy(false);
      }
    },
  };
}

// Published SubmitFeedbackRequest, checked 15 November 2026.
export async function submitFeedback(
  payload: FeedbackPayload, session: Session, idempotencyKey: string,
  signal: AbortSignal, send: typeof fetch = fetch,
  enabled = process.env.EXPO_PUBLIC_FEEDBACK_ENABLED !== "false",
): Promise<FeedbackReceipt> {
  if (sessionHasExpired()) throw new SessionExpiredError();
  if (!enabled) throw new Error("Feedback delivery is currently unavailable. Your feedback is still here; please try again later.");
  if (!API_URL.startsWith("https://")) throw new Error("Feedback requires a secure connection.");
  if (!Number.isInteger(payload.rating) || payload.rating < 1 || payload.rating > 5
    || !Array.isArray(payload.categories) || payload.categories.some(tag => !FEEDBACK_TAGS.includes(tag))
    || typeof payload.suggestions !== "string" || !idempotencyKey.trim()) throw new Error("Please review your rating and feedback before submitting.");
  let token = session.token;
  let refreshed = false;
  async function refresh() {
    if (refreshed || !session.refreshToken) return false;
    refreshed = true;
    const next = await refreshSession(session.refreshToken, signal, send);
    token = next.token;
    if (signal.aborted) throw new Error("Feedback submission was cancelled.");
    await session.saveTokens(next.token, next.refreshToken);
    return true;
  }
  if (!token && !(await refresh())) throw new Error("Sign in again to send feedback.");
  const request = () => send(`${API_URL}/api/feedback`, {
    method: "POST", signal, redirect: "error", cache: "no-store",
    headers: {
      "Content-Type": "application/json", Accept: "application/json",
      "Idempotency-Key": idempotencyKey,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ rating: payload.rating, categories: payload.categories, suggestions: payload.suggestions }),
  });
  let response = await request();
  if (response.status === 401 && await refresh()) response = await request();
  if (!response.ok) {
    throw new Error(response.status === 401 ? "Your session has expired. Sign in again to send feedback."
      : response.status === 404 || response.status === 503 ? "Feedback delivery is currently unavailable. Please try again later."
      : response.status === 429 ? "Too many feedback requests. Please wait a moment before trying again."
      : response.status === 400 || response.status === 422 ? "The server couldn't accept your feedback. Please review it and try again."
      : "Couldn't submit your feedback. Please try again. Your entries have been kept.");
  }
  if (response.status !== 200) throw new Error("The server hasn't confirmed your feedback yet. Retry to check the same submission.");
  const result = await response.json().catch(() => null);
  if (result?.success === false || result?.saved === false || ["pending", "processing", "failed", "error"].includes(String(result?.status || "").toLowerCase())) {
    throw new Error("The server hasn't confirmed your feedback yet. Retry to check the same submission.");
  }
  return { accepted: true };
}
