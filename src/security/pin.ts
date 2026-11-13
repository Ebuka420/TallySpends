import * as SecureStore from "expo-secure-store";
import * as Crypto from "expo-crypto";

export type PinRecord = { salt: string; digest: string; failures: number; blockedUntil: number; biometrics: boolean };
const options = { keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY };
const hash = (value: string) => Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, value);
const key = async (owner: string) => {
  if (!owner) throw new Error("Your account could not be identified. Sign in again.");
  return "ts_pin_v1_" + await hash(owner);
};
export async function readPin(owner: string): Promise<PinRecord | null> {
  if (!(await SecureStore.isAvailableAsync())) throw new Error("Secure app locking is unavailable on this platform. Use the mobile app.");
  const raw = await SecureStore.getItemAsync(await key(owner), options);
  if (!raw) return null;
  const record = JSON.parse(raw);
  if (!record || !/^[a-f0-9]{64}$/.test(record.digest) || !/^[a-f0-9]{64}$/.test(record.salt)
    || !Number.isInteger(record.failures) || record.failures < 0 || !Number.isFinite(record.blockedUntil) || typeof record.biometrics !== "boolean")
    throw new Error("Couldn't read your app lock. Please retry or sign out and sign in again.");
  return record;
}
export async function writePin(owner: string, record: PinRecord) {
  await SecureStore.setItemAsync(await key(owner), JSON.stringify(record), options);
}
export async function createPin(owner: string, pin: string) {
  if (!/^\d{6}$/.test(pin)) throw new Error("Enter exactly six digits.");
  const salt = Array.from(await Crypto.getRandomBytesAsync(32), byte => byte.toString(16).padStart(2, "0")).join("");
  await writePin(owner, { salt, digest: await hash(salt + ":" + pin), failures: 0, blockedUntil: 0, biometrics: false });
}
// SecureStore protects the verifier and persistent retry counter; no PIN enters AsyncStorage.
const checking = new Set<string>();
export async function verifyPin(owner: string, pin: string, now = Date.now()) {
  if (checking.has(owner)) throw new Error("Please wait for the current PIN check.");
  checking.add(owner);
  try {
    const record = await readPin(owner);
    if (!record) throw new Error("Set up your app PIN first.");
    if (record.blockedUntil > now) throw new Error(`Too many attempts. Try again in ${Math.ceil((record.blockedUntil - now) / 1000)} seconds.`);
    const digest = await hash(record.salt + ":" + pin);
    let difference = digest.length ^ record.digest.length;
    for (let i = 0; i < record.digest.length; i++) difference |= record.digest.charCodeAt(i) ^ (digest.charCodeAt(i) || 0);
    if (difference === 0 && /^\d{6}$/.test(pin)) {
      await writePin(owner, { ...record, failures: 0, blockedUntil: 0 }); return;
    }
    const failures = record.failures + 1;
    const delay = failures >= 5 ? Math.min(3600, 30 * 2 ** Math.min(failures - 5, 7)) * 1000 : 0;
    await writePin(owner, { ...record, failures, blockedUntil: now + delay });
    throw new Error(delay ? `Too many attempts. Wait ${delay / 1000} seconds or use Forgot PIN.` : "Incorrect PIN. Please try again.");
  } finally { checking.delete(owner); }
}
export async function migrateOnboardingPin(email: string, owner: string) {
  const source = "email:" + email.trim().toLowerCase();
  const record = await readPin(source);
  if (!record) {
    if (await readPin(owner)) return;
    throw new Error("Set your six-digit PIN before finishing setup.");
  }
  if (source !== owner) {
    await writePin(owner, record);
    await SecureStore.deleteItemAsync(await key(source), options);
  }
}
