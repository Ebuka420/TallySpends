import type { ApiRequest } from '../network';

/** The backend provides Smart Coach chat, not a human support/ticket endpoint. */
export async function requestHelpReply(message: string, request: ApiRequest): Promise<string> {
  const question = message.trim();
  if (!question || question.length > 4000) throw new Error('Enter a question of up to 4,000 characters.');
  const response = await request('/api/chat', { method: 'POST', body: JSON.stringify({ message: question }) });
  if (response.status !== 200) throw new Error(response.status === 429 ? 'Too many messages. Wait a moment and try again.' : 'Smart Coach could not reply. Please try again or use Email Support.');
  const data = response.data as { assistantMessage?: { content?: unknown } } | null;
  const answer = data?.assistantMessage?.content;
  if (typeof answer !== 'string' || !answer.trim()) throw new Error('Smart Coach returned an unreadable reply. Please try again.');
  return answer.trim();
}
