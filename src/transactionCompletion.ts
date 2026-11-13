let receiptId: string | null = null;
const listeners = new Set<() => void>();
export const getCompletedTransaction = () => receiptId;
export function subscribeCompletedTransaction(listener: () => void) {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}
export function clearCompletedTransaction() {
  receiptId = null;
  listeners.forEach(listener => listener());
}
/** Call only after persistence succeeds. Dismiss the completed flow back to Home. */
export function completeTransaction(router: { dismissTo: (href: "/(tabs)") => void }, id: string) {
  receiptId = id;
  listeners.forEach(listener => listener());
  router.dismissTo("/(tabs)");
}
