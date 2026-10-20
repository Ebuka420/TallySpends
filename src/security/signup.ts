import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
export type PendingSignup = { fullName: string; tallyTag: string; phoneNumber: string; email: string; password: string };
const key = "ts_pending_signup_secure_v1";
const options = { keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY };
export async function savePendingSignup(value: PendingSignup) {
  if (!await SecureStore.isAvailableAsync()) throw new Error("Secure signup is available in the mobile app. Please continue there.");
  await SecureStore.setItemAsync(key, JSON.stringify(value), options);
  await AsyncStorage.removeItem("ts_pending_signup");
}
export async function readPendingSignup(): Promise<PendingSignup | null> {
  const raw = await SecureStore.getItemAsync(key, options);
  if (raw) return JSON.parse(raw);
  const legacy = await AsyncStorage.getItem("ts_pending_signup");
  if (!legacy) return null;
  const value = JSON.parse(legacy);
  if (!value || typeof value.email !== "string" || typeof value.password !== "string") throw new Error("Restart account setup to continue.");
  await savePendingSignup(value);
  return value;
}
export async function clearPendingSignup() { await SecureStore.deleteItemAsync(key, options); await AsyncStorage.removeItem("ts_pending_signup"); }
