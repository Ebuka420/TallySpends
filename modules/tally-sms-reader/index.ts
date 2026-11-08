import { requireOptionalNativeModule } from "expo-modules-core";

export type PendingSms = { id: string; sender: string; body: string; receivedAt: string };
type NativeSmsReader = {
  configure: (enabled: boolean, consentAccepted: boolean, allowedSenders: string[]) => Promise<void>;
  readPending: () => Promise<PendingSms[]>;
  acknowledge: (ids: string[]) => Promise<void>;
  clearPending: () => Promise<void>;
  pendingCount: () => Promise<number>;
  queueStatus: () => Promise<{ pending: number; notQueued: number }>;
};

const native = requireOptionalNativeModule<NativeSmsReader>("TallySmsReader");
export const smsReaderAvailable = () => !!native;
export const configureSmsReader = (enabled: boolean, consentAccepted: boolean, allowedSenders: string[]) => {
  if (!native) throw new Error("SMS import requires an Android development or production build.");
  return native.configure(enabled, consentAccepted, allowedSenders);
};
export const readPendingSms = () => native?.readPending() ?? Promise.resolve([]);
export const acknowledgeSms = (ids: string[]) => native?.acknowledge(ids) ?? Promise.resolve();
export const clearPendingSms = () => native?.clearPending() ?? Promise.resolve();
export const pendingSmsCount = () => native?.pendingCount() ?? Promise.resolve(0);
export const smsQueueStatus = () => native?.queueStatus() ?? Promise.resolve({ pending: 0, notQueued: 0 });
