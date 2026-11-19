import type { ApiRequest } from "../network";
import { decodeTransactionFeed } from "./api";
export const manualCategories = ["Food & Dining", "Transport", "Shopping", "Bills & Utilities", "Entertainment", "Other"] as const;
export const manualMethods = ["Card", "Cash", "Transfer", "USSD"] as const;
export type ManualDraft = { amount: number; categoryId: number; paymentMethodId: number; transactionType: "Income" | "Expense"; description: string; date: string; isRecurring: boolean };
export class ManualSaveError extends Error {
  constructor(message: string, public uncertain: boolean, public createdId: number | null = null) { super(message); }
}
export function manualPayload(draft: ManualDraft) {
  if (!Number.isFinite(draft.amount) || draft.amount <= 0 || Math.abs(draft.amount * 100 - Math.round(draft.amount * 100)) > 0.00001) throw new Error("Enter a positive naira amount with at most two decimal places.");
  if (!Number.isInteger(draft.categoryId) || draft.categoryId < 1 || draft.categoryId > 6 || !Number.isInteger(draft.paymentMethodId) || draft.paymentMethodId < 1 || draft.paymentMethodId > 4) throw new Error("Choose a supported category and payment method.");
  if (!["Income", "Expense"].includes(draft.transactionType) || !Number.isFinite(Date.parse(draft.date)) || typeof draft.isRecurring !== "boolean") throw new Error("Check the transaction type and date.");
  return { accountId: 0, categoryId: draft.categoryId, vendorId: null, paymentMethodId: draft.paymentMethodId, amount: draft.amount, transactionType: draft.transactionType, description: draft.description.trim() || null, transactionDate: new Date(draft.date).toISOString(), isRecurring: draft.isRecurring };
}
export async function confirmManualTransaction(id: number, request: ApiRequest) {
  try {
    const r = await request('/api/transactions');
    if (r.status !== 200) throw new Error();
    const record = decodeTransactionFeed(r.data).find(item => item.id === String(id));
    if (!record) throw new Error();
    return record;
  } catch { throw new ManualSaveError("The entry was saved, but it hasn't been confirmed in history yet. Refresh to check; don't add it again.", true, id); }
}
export async function createManualTransaction(draft: ManualDraft, request: ApiRequest) {
  const payload = manualPayload(draft);
  let response;
  try { response = await request('/api/transactions', { method: 'POST', body: JSON.stringify(payload) }); }
  catch { throw new ManualSaveError("The save result is unknown. Check your history before adding this entry again.", true); }
  if (response.status !== 201) throw new ManualSaveError(response.status === 400 ? "The service rejected this entry. Check the details." : "The save was not confirmed. Check history before adding it again.", response.status >= 500 || response.status === 200 || response.status === 202);
  if (!Number.isSafeInteger(response.data) || Number(response.data) <= 0) throw new ManualSaveError("The service didn't return a transaction ID. Check history before adding this entry again.", true);
  return confirmManualTransaction(Number(response.data), request);
}
