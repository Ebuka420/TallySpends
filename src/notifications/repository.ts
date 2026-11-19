import AsyncStorage from '@react-native-async-storage/async-storage';
import type { NotificationItem } from '../store';
type Snapshot = { owner: string | null; items: NotificationItem[]; loading: boolean; error: string | null };
let snapshot: Snapshot = { owner: null, items: [], loading: false, error: null };
let epoch = 0;
let queue: Promise<unknown> = Promise.resolve();
const listeners = new Set<() => void>();
export const notificationKey = (owner: string) => 'ts_notifications_v2_' + encodeURIComponent(owner);
export const getNotifications = () => snapshot;
export function subscribeNotifications(listener: () => void) { listeners.add(listener); return () => { listeners.delete(listener); }; }
const publish = (patch: Partial<Snapshot>) => { snapshot = { ...snapshot, ...patch }; listeners.forEach(listener => listener()); };
export function setNotificationOwner(owner: string | null) { if (owner !== snapshot.owner) { epoch++; publish({ owner, items: [], error: null, loading: false }); } }
export async function loadNotifications() {
  const started = epoch, owner = snapshot.owner;
  if (!owner) return;
  const job = queue.then(async () => {
    if (started !== epoch) return;
    publish({ loading: true, error: null });
    try {
      const saved = await AsyncStorage.getItem(notificationKey(owner));
      const parsed: unknown = saved ? JSON.parse(saved) : [];
      if (!Array.isArray(parsed) || parsed.some(item => !item || typeof item.id !== 'string' || typeof item.title !== 'string' || typeof item.description !== 'string' || typeof item.timestamp !== 'string' || typeof item.isUnread !== 'boolean' || !['transaction', 'alert', 'insight', 'bill', 'system'].includes(item.type))) throw new Error('Invalid notification data');
      if (started === epoch) publish({ items: parsed, loading: false });
    } catch { if (started === epoch) publish({ items: [], loading: false, error: "Couldn't load your saved notifications." }); }
  });
  queue = job.catch(() => {}); return job;
}
export function changeNotifications(change: (items: NotificationItem[]) => NotificationItem[]) {
  const owner = snapshot.owner, started = epoch;
  if (!owner) return Promise.resolve();
  const job = queue.then(async () => {
    if (epoch !== started) return;
    // Read first so incoming pushes cannot overwrite an unhydrated inbox.
    const saved = await AsyncStorage.getItem(notificationKey(owner));
    if (epoch !== started) return;
    const items = saved ? JSON.parse(saved) : snapshot.items;
    const next = change(Array.isArray(items) ? items : []);
    await AsyncStorage.setItem(notificationKey(owner), JSON.stringify(next));
    if (epoch === started) publish({ items: next, error: null });
  }).catch(() => { if (epoch === started) publish({ error: "Couldn't save your notifications." }); });
  queue = job; return job;
}
