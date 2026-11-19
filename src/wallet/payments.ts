import AsyncStorage from "@react-native-async-storage/async-storage";
import type { ApiRequest } from "../network";
import { validatePayment, walletApi, WalletServiceError, type PaymentDraft, type PaymentReceipt } from "./api";
export type SavedPayment = { key: string; draft: PaymentDraft; createdAt: string; state: "ready" | "unknown" | "Pending" | "Completed" | "Failed" | "Rejected"; receipt?: PaymentReceipt; error?: string };
const storageKey = (owner: string) => "ts_wallet_payment_v1_" + encodeURIComponent(owner);
const locks = new Set<string>();
export const paymentUnresolved = (payment: SavedPayment) => ["ready", "unknown", "Pending"].includes(payment.state);
async function save(owner: string, payment: SavedPayment) { await AsyncStorage.setItem(storageKey(owner), JSON.stringify(payment)); return payment; }
export async function loadPayment(owner: string): Promise<SavedPayment | null> {
  const raw = await AsyncStorage.getItem(storageKey(owner));
  if (!raw) return null;
  try {
    const value = JSON.parse(raw) as SavedPayment;
    validatePayment(value.draft);
    if (!/^[A-Za-z0-9_-]{8,64}$/.test(value.key) || !["ready", "unknown", "Pending", "Completed", "Failed", "Rejected"].includes(value.state)) throw new Error();
    return value;
  } catch { throw new Error("Your previous payment record couldn't be read. Contact support before sending again."); }
}
export async function preparePayment(owner: string, draft: PaymentDraft, newKey: string): Promise<SavedPayment> {
  if (locks.has(owner)) throw new Error("A payment is already in progress.");
  locks.add(owner);
  try {
    validatePayment(draft);
    const previous = await loadPayment(owner);
    if (previous && paymentUnresolved(previous)) {
      if (JSON.stringify(previous.draft) !== JSON.stringify(draft)) throw new Error("Check your previous payment before starting another one.");
      return previous;
    }
    if (!/^[A-Za-z0-9_-]{8,64}$/.test(newKey)) throw new Error("Invalid payment reference.");
    return await save(owner, { key: newKey, draft, createdAt: new Date().toISOString(), state: "ready" });
  } finally { locks.delete(owner); }
}
export async function submitPayment(owner: string, payment: SavedPayment, request: ApiRequest, checkOnly = false): Promise<SavedPayment> {
  if (locks.has(owner)) throw new Error("A payment is already in progress.");
  locks.add(owner);
  try {
    const current = await loadPayment(owner);
    if (!current || current.key !== payment.key) throw new Error("The saved payment changed. Refresh before trying again.");
    if (!paymentUnresolved(current)) return current;
    let receipt: PaymentReceipt | null = null;
    // Persist uncertainty before any network mutation. Process termination cannot
    // lose the original key or accidentally produce a new payment on restart.
    await save(owner, { ...current, state: "unknown" });
    try {
      if (current.draft.kind === "bank" && (checkOnly || current.state !== "ready")) receipt = await walletApi.status(current.key, request);
      if (!receipt && checkOnly && current.draft.kind === "bank") return await save(owner, { ...current, state: "unknown", error: "The transfer isn't visible yet. Retry the saved transfer with the same reference." });
      if (!receipt) receipt = await walletApi.pay(current.draft, current.key, request);
      const state = receipt.status === "InsufficientFunds" || receipt.status === "RecipientNotVerified" ? "Rejected" : receipt.status;
      return await save(owner, { ...current, state, receipt, error: undefined });
    } catch (error) {
      const definitive = error instanceof WalletServiceError && [400, 403, 404].includes(error.status);
      return await save(owner, { ...current, state: definitive ? "Rejected" : "unknown", error: error instanceof Error ? error.message : "The payment result is not confirmed. Check this payment again." });
    }
  } finally { locks.delete(owner); }
}
