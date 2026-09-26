export class CoachRequestError extends Error {}

export async function requestCoachReply(question: string, token: string | null, signal: AbortSignal, send: typeof fetch = fetch): Promise<string> {
  if (!token) throw new CoachRequestError("Sign in again to chat with your coach. Your question is kept here.");
  const response = await send("https://tallyspendapi-production.up.railway.app/api/chat", {
    method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ message: question }), signal,
  });
  if (!response.ok) throw new CoachRequestError(response.status === 401 ? "Your session has expired. Sign in again to continue." : "Your coach couldn't connect. Try sending your question again.");
  const data = await response.json().catch(() => { throw new CoachRequestError("Your coach couldn't finish that reply. Please try again."); });
  const answer = data?.assistantMessage?.content;
  if (typeof answer !== "string" || !answer.trim()) throw new CoachRequestError("Your coach couldn't finish that reply. Please try again.");
  return answer.trim();
}
