import type { ApiRequest, ApiResponse } from "../network";
export type WalletBalance = { balanceKobo: number; currency: "NGN" };
export type VirtualAccount = { accountNumber: string; accountName: string; bankName: string; status: string };
export type WalletEntry = { id: string; amount: number; entryType: "Credit" | "Debit"; status: "Pending" | "Posted" | "Reversed"; source: string; description: string; createdAt: string };
export type PaymentReceipt = { reference: string; status: "Completed" | "Pending" | "Failed" | "InsufficientFunds" | "RecipientNotVerified"; recipientName: string | null; amountKobo?: number };
export type PaymentDraft = { kind: "user"; paymentId: string; amountKobo: number; note: string }
  | { kind: "bank"; bankCode: string; accountNumber: string; amountKobo: number; narration: string };
export function amountKobo(text: string): number {
  if (!/^\d{1,7}(\.\d{1,2})?$/.test(text)) throw new Error("Enter an amount with no more than two decimal places.");
  const [whole, fraction = ""] = text.split(".");
  const value = Number(whole) * 100 + Number(fraction.padEnd(2, "0"));
  if (!Number.isSafeInteger(value) || value <= 0 || value > 100000000) throw new Error("Enter between ₦0.01 and ₦1,000,000.");
  return value;
}
export class WalletServiceError extends Error {
  constructor(message: string, public status: number) { super(message); }
}
export function walletError(status: number): Error {
  return new WalletServiceError(status === 403 ? "Your account is not eligible for this operation. Contact support."
    : status === 404 ? "The account or payment could not be found."
    : status === 409 ? "This payment key was used for different details. Check the previous payment before starting a new one."
    : status === 429 ? "Too many requests. Wait a minute and try again."
    : status === 400 ? "The service rejected these details. Check the recipient and amount."
    : "The wallet service couldn't complete this request. Please retry.", status);
}
function object(value: unknown): Record<string, any> {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("The wallet service returned an unreadable response.");
  return value as Record<string, any>;
}
export function decodeBalance(value: unknown): WalletBalance {
  const item = object(value);
  if (!Number.isSafeInteger(item.balanceKobo) || item.currency !== "NGN" || typeof item.balance !== "number"
    || !Number.isFinite(item.balance) || Math.round(item.balance * 100) !== item.balanceKobo) throw new Error("The wallet balance could not be verified.");
  return { balanceKobo: item.balanceKobo, currency: "NGN" };
}
export function decodeAccount(value: unknown): VirtualAccount {
  const item = object(value);
  if (!/^\d{10}$/.test(item.accountNumber) || ![item.accountName, item.bankName, item.status].every(v => typeof v === "string" && v.trim())) throw new Error("The wallet account details could not be verified.");
  return { accountNumber: item.accountNumber, accountName: item.accountName, bankName: item.bankName, status: item.status };
}
export function decodeLedger(value: unknown): WalletEntry[] {
  if (!Array.isArray(value)) throw new Error("Wallet history could not be read.");
  const ids = new Set<string>();
  return value.map(value => {
    const item = object(value);
    if (!Number.isSafeInteger(item.id) || item.id <= 0 || ids.has(String(item.id)) || !["Credit", "Debit"].includes(item.entryType)
      || !["Pending", "Posted", "Reversed"].includes(item.status) || typeof item.amount !== "number" || !Number.isFinite(item.amount)
      || item.entryType === "Credit" && item.amount < 0 || item.entryType === "Debit" && item.amount > 0
      || typeof item.source !== "string" || typeof item.createdAt !== "string" || !Number.isFinite(Date.parse(item.createdAt))
      || item.description !== null && typeof item.description !== "string") throw new Error("Wallet history contains an invalid entry.");
    ids.add(String(item.id));
    return { id: String(item.id), amount: item.amount, entryType: item.entryType, status: item.status, source: item.source, description: item.description || "", createdAt: item.createdAt };
  });
}
export function validatePayment(draft: PaymentDraft) {
  if (!Number.isSafeInteger(draft.amountKobo) || draft.amountKobo <= 0 || draft.amountKobo > 100000000) throw new Error("The transfer amount is outside the allowed range.");
  if (draft.kind === "user") {
    if (!/^TSP-[A-Z0-9]{4}-[A-Z0-9]{4}$/.test(draft.paymentId) || draft.note.length > 100) throw new Error("Check the payment ID and keep the note within 100 characters.");
  } else if (draft.kind !== "bank" || !/^\d+$/.test(draft.bankCode) || !/^\d{10}$/.test(draft.accountNumber)) throw new Error("Enter a bank code and a 10-digit account number.");
}
export function decodeReceipt(response: ApiResponse, kind: PaymentDraft["kind"]): PaymentReceipt {
  if (kind === "user" && ![200, 400].includes(response.status)) throw walletError(response.status);
  const item = object(response.data);
  const allowed: Record<number, string[]> = { 200: ["Completed", "Pending", "Failed"], 202: ["Pending"], 400: ["InsufficientFunds", "RecipientNotVerified"], 502: ["Failed"] };
  if (!allowed[response.status]?.includes(item.status) || typeof item.reference !== "string" && !["InsufficientFunds", "RecipientNotVerified"].includes(item.status)
    || !["InsufficientFunds", "RecipientNotVerified"].includes(item.status) && !item.reference.trim()
    || item.recipientName !== null && typeof item.recipientName !== "string") throw walletError(response.status);
  if (kind === "user" && response.status === 200 && (item.status !== "Completed" || !Number.isSafeInteger(item.amountKobo) || item.amountKobo <= 0)) throw new Error("The payment result could not be verified. Check the same payment again.");
  return { reference: item.reference || "", status: item.status, recipientName: item.recipientName,
    ...(kind === "user" && item.status === "Completed" ? { amountKobo: item.amountKobo } : {}) };
}
export type BankItem = { code: string; name: string };
export type ResolvedAccount = { accountName: string; accountNumber: string; bankCode: string };

export function decodeBankList(value: unknown): BankItem[] {
  if (!Array.isArray(value)) throw new Error("Bank list could not be loaded.");
  return value
    .filter(item => item && typeof item === "object" && typeof item.code === "string" && typeof item.name === "string")
    .map(item => ({ code: item.code.trim(), name: item.name.trim() }));
}

export function decodeResolvedAccount(value: unknown, bankCode: string, accountNumber: string): ResolvedAccount {
  const item = object(value);
  const accountName = String(item.accountName || item.account_name || item.name || item.data?.account_name || "").trim();
  if (!accountName) {
    throw new Error(typeof item.message === "string" ? item.message : "Could not verify recipient account name.");
  }
  return { accountName, accountNumber, bankCode };
}

export const walletApi = {
  async balance(request: ApiRequest) { const r = await request("/api/wallet/balance"); if (r.status !== 200) throw walletError(r.status); return decodeBalance(r.data); },
  async ledger(request: ApiRequest) { const r = await request("/api/wallet/ledger?limit=50"); if (r.status !== 200) throw walletError(r.status); return decodeLedger(r.data); },
  async account(request: ApiRequest, create = false) { const r = await request("/api/wallet/virtual-account", create ? { method: "POST" } : {}); if (!create && r.status === 404) return null; if (r.status !== 200) throw walletError(r.status); return decodeAccount(r.data); },
  async banks(request: ApiRequest): Promise<BankItem[]> {
    const r = await request("/api/wallet/banks");
    if (r.status !== 200) throw walletError(r.status);
    return decodeBankList(r.data);
  },
  async resolveAccount(bankCode: string, accountNumber: string, request: ApiRequest): Promise<ResolvedAccount> {
    if (!/^\d+$/.test(bankCode) || !/^\d{10}$/.test(accountNumber)) {
      throw new Error("Enter a bank code and a 10-digit account number.");
    }
    const r = await request(`/api/wallet/resolve-account?bankCode=${encodeURIComponent(bankCode)}&accountNumber=${encodeURIComponent(accountNumber)}`);
    if (r.status === 404) {
      const msg = r.data && typeof r.data === "object" && typeof (r.data as any).message === "string" ? (r.data as any).message : "Account number could not be verified for this bank.";
      throw new Error(msg);
    }
    if (r.status !== 200) throw walletError(r.status);
    return decodeResolvedAccount(r.data, bankCode, accountNumber);
  },
  async pay(draft: PaymentDraft, key: string, request: ApiRequest) {
    validatePayment(draft);
    if (!/^[A-Za-z0-9_-]{8,64}$/.test(key)) throw new Error("Invalid payment reference.");
    const { kind, ...body } = draft;
    const response = await request(kind === "user" ? "/api/wallet/send" : "/api/wallet/transfer", { method: "POST", body: JSON.stringify({ ...body, idempotencyKey: key }) });
    const receipt = decodeReceipt(response, kind);
    if (receipt.amountKobo !== undefined && receipt.amountKobo !== draft.amountKobo) throw new Error("The returned amount does not match. Check the same payment again.");
    return receipt;
  },
  async status(key: string, request: ApiRequest) {
    if (!/^[A-Za-z0-9_-]{8,64}$/.test(key)) throw new Error("Invalid payment reference.");
    const response = await request("/api/wallet/transfer/" + key);
    if (response.status === 404) return null;
    return decodeReceipt(response, "bank");
  },
};
