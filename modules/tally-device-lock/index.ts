import { requireOptionalNativeModule } from "expo-modules-core";
type Snapshot = { supported: boolean; screenOff: boolean };
const native = requireOptionalNativeModule<{ takeSnapshot: () => Snapshot; addListener: (event: string, listener: () => void) => { remove: () => void } }>("TallyDeviceLock");
export function onDeviceScreenOff(listener: () => void) {
  try { return native?.addListener("onScreenOff", listener) || { remove() {} }; }
  catch { return { remove() {} }; }
}
export function takeDeviceLockSnapshot(): Snapshot {
  try {
    const result = native?.takeSnapshot();
    if (result && typeof result.supported === "boolean" && typeof result.screenOff === "boolean") return result;
  } catch { /* A missing or broken native monitor must not relax the app lock. */ }
  return { supported: false, screenOff: false };
}
