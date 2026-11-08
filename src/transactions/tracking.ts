import type { AuthenticatedBankRequest } from "../banking/backend";
import { decodeSmsImportResponse, getTransactions, type SmsImportResponse } from "./api";
export { formatSmsImportResult } from "./api";

export async function checkTransactionFeed(request: AuthenticatedBankRequest) {
  return getTransactions(request);
}

export type BankAlert = { sender: string; body: string; receivedAt: string };
export type SmsImportAccess = {
  platform: string;
  nativeInboxAvailable: boolean;
  consentAccepted: boolean;
  allowedSenders: readonly string[];
};

// Candidate filtering only: it does not parse money, infer account ownership,
// read the inbox, persist SMS text, or claim server-side reconciliation.
export function eligibleBankAlerts(messages: readonly BankAlert[], access: SmsImportAccess): BankAlert[] {
  if (access.platform !== "android" || !access.nativeInboxAvailable || !access.consentAccepted) return [];
  const senders = new Set(access.allowedSenders.map(value => value.trim().toLowerCase()).filter(Boolean));
  return messages.filter(message => {
    if (!message || typeof message.sender !== "string" || typeof message.body !== "string" || typeof message.receivedAt !== "string") return false;
    if (!senders.has(message.sender.trim().toLowerCase()) || !message.body.trim() || !Number.isFinite(Date.parse(message.receivedAt))) return false;
    if (/\b(otp|one[ -]?time|verification|verify|password|passcode|pin|authentication|security code)\b/i.test(message.body)) return false;
    if (!/\b(debit(?:ed)?|credit(?:ed)?)\b/i.test(message.body) || !/(?:\b(?:NGN|Naira)\s*|₦\s*)[\d,]+(?:\.\d{1,2})?/i.test(message.body)) return false;
    return true;
  }).map(({ sender, body, receivedAt }) => ({ sender, body, receivedAt }));
}

// Sends eligible messages to the server as the sole transaction creator. Full
// bodies remain in memory only; the backend owns parsing and deduplication.
export async function importEligibleBankAlerts(
  request: AuthenticatedBankRequest,
  messages: readonly BankAlert[],
  access: SmsImportAccess,
  accountId?: number,
): Promise<{ submitted: number; response: SmsImportResponse | null }> {
  if (accountId !== undefined && (!Number.isSafeInteger(accountId) || accountId <= 0)) {
    throw new Error("Choose a valid linked account before importing messages.");
  }
  const eligible = eligibleBankAlerts(messages, access);
  if (!eligible.length) return { submitted: 0, response: null };
  const body: { messages: BankAlert[]; accountId?: number } = { messages: eligible };
  if (accountId !== undefined) body.accountId = accountId;
  const response = await request("/api/sms/import", {
    method: "POST",
    body: JSON.stringify(body),
  });
  return { submitted: eligible.length, response: decodeSmsImportResponse(response) };
}
