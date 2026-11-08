import type { Transaction } from "../budget/ledger";
import type { AuthenticatedBankRequest } from "../banking/backend";

export type BackendTransaction = {
  id: string;
  amount: number;
  currency: string;
  transactionType: "Income" | "Expense";
  categoryName: string | null;
  vendorName: string | null;
  paymentMethodName: string | null;
  description: string | null;
  isRecurring: boolean;
  source: "Sms" | "BankSync" | "Manual" | string;
  transactionDate: string;
};

export type SmsImportStatus = "Imported" | "Duplicate" | "Ignored" | "Unparsed";
export type SmsImportResult = {
  index: number;
  status: SmsImportStatus;
  transactionId: string | number | null;
  parsed: Record<string, unknown> | null;
};
export type SmsImportResponse = {
  imported: number;
  duplicates: number;
  ignored: number;
  unparsed: number;
  results: SmsImportResult[];
};
export type SmsImportDisplayResult = { batch: number; index: number; status: SmsImportStatus };
export type SmsImportDisplaySummary = {
  imported: number;
  duplicates: number;
  ignored: number;
  unparsed: number;
  results: SmsImportDisplayResult[];
};

function record(value: unknown, label: string): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error(`The backend returned an invalid ${label}.`);
  return value as Record<string, unknown>;
}
function nullableString(value: unknown, field: string): string | null {
  if (value === null || value === undefined) return null;
  if (typeof value !== "string") throw new Error(`The backend returned an invalid transaction ${field}.`);
  return value;
}
function requiredCount(value: unknown, field: string) {
  if (!Number.isSafeInteger(value) || Number(value) < 0) throw new Error(`The backend returned an invalid SMS import ${field} count.`);
  return Number(value);
}

export function decodeTransactionFeed(value: unknown): Transaction[] {
  if (!Array.isArray(value)) throw new Error("The transaction service returned an unexpected response. Please refresh and try again.");
  const ids = new Set<string>();
  return value.map((value, index) => {
    const item = record(value, `transaction at position ${index}`);
    const id = typeof item.id === "string" || typeof item.id === "number" ? String(item.id).trim() : "";
    const amount = item.amount;
    const currency = item.currency;
    const type = item.transactionType;
    const source = item.source;
    const recurring = item.isRecurring;
    const date = item.transactionDate;
    if (!id || typeof amount !== "number" || !Number.isFinite(amount) || amount < 0) throw new Error(`The backend returned an invalid transaction amount or ID at position ${index}.`);
    if (ids.has(id)) throw new Error("The transaction service returned duplicate IDs. Please retry after the backend feed is corrected.");
    ids.add(id);
    if (typeof currency !== "string" || currency.trim().toUpperCase() !== "NGN") throw new Error(`The transaction at position ${index} is not in NGN and cannot be safely included in naira totals.`);
    if (type !== "Income" && type !== "Expense") throw new Error(`The backend returned an unsupported transaction type at position ${index}.`);
    if (typeof source !== "string" || !source.trim()) throw new Error(`The backend returned an invalid transaction source at position ${index}.`);
    if (typeof recurring !== "boolean") throw new Error(`The backend returned an invalid recurring flag at position ${index}.`);
    if (typeof date !== "string" || !date.trim() || !/(?:Z|\+00:00)$/i.test(date) || !Number.isFinite(Date.parse(date))) throw new Error(`The backend returned an invalid UTC transaction date at position ${index}.`);
    const categoryName = nullableString(item.categoryName, "categoryName");
    const vendorName = nullableString(item.vendorName, "vendorName");
    const paymentMethodName = nullableString(item.paymentMethodName, "paymentMethodName");
    const description = nullableString(item.description, "description");
    const title = vendorName?.trim() || description?.trim() || categoryName?.trim() || (type === "Income" ? "Income" : "Expense");
    return {
      id,
      title,
      amount,
      category: categoryName?.trim() || "Others",
      categoryName,
      type: type === "Income" ? "income" : "expense",
      date,
      currency: currency.trim().toUpperCase(),
      source: source.trim(),
      isRecurring: recurring,
      ...(description !== null ? { memo: description } : {}),
      ...(vendorName !== null ? { vendorName } : {}),
      ...(paymentMethodName !== null ? { method: paymentMethodName } : {}),
      isServerTransaction: true,
    } as Transaction;
  });
}

export async function getTransactions(request: AuthenticatedBankRequest): Promise<Transaction[]> {
  return decodeTransactionFeed(await request("/api/transactions"));
}

function decodeParsed(value: unknown, index: number): SmsImportResult["parsed"] {
  if (value === null) return null;
  return record(value, `SMS parsed result at index ${index}`);
}

export function decodeSmsImportResponse(value: unknown): SmsImportResponse {
  const item = record(value, "SMS import response");
  if (!Array.isArray(item.results)) throw new Error("The SMS import response did not include per-message results. The alerts remain queued for retry.");
  const results = item.results.map((value, position): SmsImportResult => {
    const result = record(value, `SMS import result at position ${position}`);
    const index = result.index;
    const status = result.status;
    if (!Number.isSafeInteger(index) || Number(index) < 0) throw new Error("The backend returned an invalid SMS result index. The alerts remain queued for retry.");
    if (status !== "Imported" && status !== "Duplicate" && status !== "Ignored" && status !== "Unparsed") throw new Error("The backend returned an unknown SMS import status. The alerts remain queued for retry.");
    const transactionId = result.transactionId === null || result.transactionId === undefined
      ? null
      : typeof result.transactionId === "string" || typeof result.transactionId === "number"
        ? result.transactionId
        : (() => { throw new Error("The backend returned an invalid SMS transaction ID. The alerts remain queued for retry."); })();
    return { index: Number(index), status, transactionId, parsed: decodeParsed(result.parsed, Number(index)) };
  });
  const summary: SmsImportResponse = {
    imported: requiredCount(item.imported, "imported"),
    duplicates: requiredCount(item.duplicates, "duplicates"),
    ignored: requiredCount(item.ignored, "ignored"),
    unparsed: requiredCount(item.unparsed, "unparsed"),
    results,
  };
  const byStatus = results.reduce((counts, result) => ({ ...counts, [result.status]: counts[result.status] + 1 }), {
    Imported: 0, Duplicate: 0, Ignored: 0, Unparsed: 0,
  });
  if (summary.imported !== byStatus.Imported || summary.duplicates !== byStatus.Duplicate || summary.ignored !== byStatus.Ignored || summary.unparsed !== byStatus.Unparsed) {
    throw new Error("The SMS import summary did not match its per-message results. The alerts remain queued for retry.");
  }
  return summary;
}

export function smsImportDisplaySummary(batches: readonly SmsImportResponse[]): SmsImportDisplaySummary {
  return batches.reduce<SmsImportDisplaySummary>((summary, batch, batchIndex) => ({
    imported: summary.imported + batch.imported,
    duplicates: summary.duplicates + batch.duplicates,
    ignored: summary.ignored + batch.ignored,
    unparsed: summary.unparsed + batch.unparsed,
    results: summary.results.concat(batch.results.map(result => ({ batch: batchIndex + 1, index: result.index, status: result.status }))),
  }), { imported: 0, duplicates: 0, ignored: 0, unparsed: 0, results: [] });
}

export function formatSmsImportResult(summary: SmsImportDisplaySummary): string {
  const lines = [`SMS import: ${summary.imported} imported, ${summary.duplicates} duplicate, ${summary.ignored} ignored, ${summary.unparsed} unparsed.`];
  if (summary.results.length) {
    lines.push("Per-message results:");
    lines.push(...summary.results.map(result => `Batch ${result.batch}, backend result ${result.index}: ${result.status}`));
  }
  return lines.join("\n");
}

export function mergeTransactionFeed(remote: readonly Transaction[], local: readonly Transaction[], seed: readonly Transaction[]): Transaction[] {
  const seedById = new Map(seed.map(tx => [tx.id, tx]));
  const isUnmodifiedSeed = (tx: Transaction) => {
    const original = seedById.get(tx.id);
    if (!original) return false;
    const keys = Object.keys(tx);
    return keys.length === Object.keys(original).length && keys.every(key => tx[key] === original[key as keyof Transaction]);
  };
  const remoteById = new Map(remote.map(tx => [tx.id, tx]));
  const localById = new Map(local.filter(tx => !isUnmodifiedSeed(tx)).map(tx => [tx.id, tx]));
  const records = remote.map(tx => {
    const old = localById.get(tx.id);
    if (!old) return tx;
    localById.delete(tx.id);
    return { ...old, ...tx, ...(old.receiptImage ? { receiptImage: old.receiptImage } : {}) };
  });
  for (const tx of localById.values()) {
    if (!remoteById.has(tx.id)) records.push({ ...tx, source: typeof tx.source === "string" ? tx.source : "LocalManual", isServerTransaction: false });
  }
  return records.sort((left, right) => Date.parse(right.date) - Date.parse(left.date));
}
