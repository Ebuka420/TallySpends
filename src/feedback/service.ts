import { API_URL } from "../api";

export const FEEDBACK_TAGS = [
  "Budgeting Tools", "Expense Tracking", "Ajo Circles", "User Interface",
  "App Performance", "Customer Support",
];
export type FeedbackDraft = { rating: number; tags: string[]; suggestions: string };
export type FeedbackPayload = Omit<FeedbackDraft, "rating"> & { rating: number | null; submittedAt: string };
export type FeedbackReceipt = { id: string; saved: true; emailStatus: "queued" | "sent" };
type Session = {
  token: string | null;
  refreshToken: string | null;
  saveTokens: (token: string, refreshToken: string) => Promise<void>;
};

export function canSubmitFeedback(draft: FeedbackDraft) {
  return (Number.isInteger(draft.rating) && draft.rating >= 1 && draft.rating <= 5)
    || draft.suggestions.trim().length > 0;
}

export function toggleFeedbackTag(tags: string[], tag: string) {
  return tags.includes(tag) ? tags.filter(value => value !== tag) : [...tags, tag];
}

// Own the synchronous submission lock and keep the same key/timestamp when
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
      if (!canSubmitFeedback(draft) || !Number.isInteger(draft.rating) || draft.rating < 0 || draft.rating > 5) {
        throw new Error("Select a star rating or write some feedback before submitting.");
      }
      if (draft.tags.some(tag => !FEEDBACK_TAGS.includes(tag))) throw new Error("Please select one of the available improvement categories.");
      const signature = JSON.stringify({ ...draft, tags: [...draft.tags].sort() });
      if (signature !== previousSignature) {
        previousSignature = signature;
        key = `feedback-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`;
        payload = { rating: draft.rating || null, tags: [...draft.tags], suggestions: draft.suggestions, submittedAt: new Date().toISOString() };
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

// Proposed contract, NOT a verified deployed endpoint. Enable only after the
// backend provides database persistence + durable email queuing as documented.
export async function submitFeedback(
  payload: FeedbackPayload, session: Session, idempotencyKey: string,
  signal: AbortSignal, send: typeof fetch = fetch,
  enabled = process.env.EXPO_PUBLIC_FEEDBACK_ENABLED === "true",
): Promise<FeedbackReceipt> {
  if (!enabled) throw new Error("Feedback delivery is currently unavailable. Your feedback is still here; please try again later.");
  let token = session.token;
  let refreshed = false;
  async function refresh() {
    if (refreshed || !session.refreshToken) return false;
    refreshed = true;
    const response = await send(`${API_URL}/api/auth/refresh`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken: session.refreshToken }), signal,
    });
    if (!response.ok) return false;
    const data = await response.json();
    const accessToken = data?.accessToken || data?.token;
    if (typeof accessToken !== "string" || !accessToken.trim()) return false;
    token = accessToken;
    await session.saveTokens(accessToken, data.refreshToken || session.refreshToken);
    return true;
  }
  // Never silently submit anonymously when a known user's session has expired.
  if (!token && session.refreshToken && !(await refresh())) throw new Error("Your session has expired. Sign in again to send feedback.");
  const request = () => send(`${API_URL}/api/feedback`, {
    method: "POST", signal,
    headers: {
      "Content-Type": "application/json", Accept: "application/json",
      "Idempotency-Key": idempotencyKey,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(payload),
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
  const receipt = await response.json().catch(() => null);
  if (!receipt || typeof receipt.id !== "string" || !receipt.id.trim() || receipt.saved !== true
    || !["queued", "sent"].includes(receipt.emailStatus)) {
    throw new Error("We couldn't confirm that your feedback was saved. Retry to check the same submission.");
  }
  return { id: receipt.id, saved: true, emailStatus: receipt.emailStatus };
}
