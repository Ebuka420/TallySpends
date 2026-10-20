import type { AuthenticatedBankRequest } from "../banking/backend";

// Swagger confirms this route, but supplies no success schema, units, pagination,
// or debit/credit enum. Never infer a financial DTO from a create request DTO.
export async function checkTransactionFeed(request: AuthenticatedBankRequest): Promise<never> {
  await request("/api/transactions");
  throw new Error("The transaction service responded, but its response format still needs confirmation before automatic imports can be enabled. Your manually entered transactions have been kept.");
}

export type BankAlert = { sender: string; body: string; receivedAt: string };
export type SmsImportAccess = {
  platform: string;
  nativeInboxAvailable: boolean;
  distributionApproved: boolean;
  consentAccepted: boolean;
  allowedSenders: readonly string[];
};

// Candidate filtering only: it does not parse money, infer account ownership,
// read the inbox, persist SMS text, or claim server-side reconciliation.
export function eligibleBankAlerts(messages: readonly BankAlert[], access: SmsImportAccess): BankAlert[] {
  if (access.platform !== "android" || !access.nativeInboxAvailable || !access.distributionApproved || !access.consentAccepted) return [];
  const senders = new Set(access.allowedSenders.map(value => value.trim().toLowerCase()).filter(Boolean));
  const seen = new Set<string>();
  return messages.filter(message => {
    if (!message || typeof message.sender !== "string" || typeof message.body !== "string" || typeof message.receivedAt !== "string") return false;
    if (!senders.has(message.sender.trim().toLowerCase()) || !message.body.trim() || !Number.isFinite(Date.parse(message.receivedAt))) return false;
    if (/\b(otp|one[ -]?time|verification|verify|password|passcode|pin|authentication|security code)\b/i.test(message.body)) return false;
    if (!/\b(debit(?:ed)?|credit(?:ed)?)\b/i.test(message.body) || !/(?:\b(?:NGN|Naira)\s*|₦\s*)[\d,]+(?:\.\d{1,2})?/i.test(message.body)) return false;
    // Exact repeats within a batch only. Equal amounts are never enough to merge.
    const key = JSON.stringify([message.sender, message.body, message.receivedAt]);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  }).map(({ sender, body, receivedAt }) => ({ sender, body, receivedAt }));
}
