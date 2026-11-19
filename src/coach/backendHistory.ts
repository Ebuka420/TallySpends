import type { ApiRequest } from '../network';
import type { CoachConversation } from './history';
export function decodeCoachHistory(value: unknown): CoachConversation[] {
  if (!Array.isArray(value)) throw new Error('The coach returned an invalid history response.');
  if (!value.length) return [];
  const ids = new Set<string>();
  const messages = value.map(item => {
    if (!item || !['user', 'assistant'].includes(item.role) || typeof item.content !== 'string' || typeof item.createdAt !== 'string' || !Number.isFinite(Date.parse(item.createdAt)) || !Number.isSafeInteger(item.id) || item.id <= 0 || ids.has(String(item.id))) throw new Error('The coach returned an invalid history message.');
    ids.add(String(item.id));
    return { id: String(item.id), sender: item.role === 'user' ? 'user' as const : 'coach' as const, text: item.content };
  });
  // The API exposes a single stream, not separate conversation IDs.
  return [{ id: 'server-history', createdAt: value[0].createdAt, updatedAt: value[value.length - 1].createdAt, messages }];
}
export async function fetchCoachHistory(request: ApiRequest) {
  const response = await request('/api/chat/history');
  if (response.status !== 200) throw new Error("Couldn't load your coach history. Please retry.");
  return decodeCoachHistory(response.data);
}
