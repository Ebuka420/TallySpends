import { acknowledgeSms, readPendingSms } from "../../modules/tally-sms-reader";
import type { AuthenticatedBankRequest } from "../banking/backend";
import { smsImportDisplaySummary, type SmsImportDisplaySummary, type SmsImportResponse } from "./api";
import { importEligibleBankAlerts } from "./tracking";

export const SMS_CONSENT_KEY = "ts_sms_import_consent_v1";
export const SMS_SENDERS_KEY = "ts_sms_import_senders_v1";
export const SMS_ENABLED_KEY = "ts_sms_import_enabled_v1";
export const SMS_LAST_RESULT_KEY = "ts_sms_import_last_result_v1";

export async function drainQueuedBankAlerts(request: AuthenticatedBankRequest, senders: readonly string[], refreshTransactions: () => Promise<unknown>, onBatchComplete?: (summary: SmsImportDisplaySummary, submitted: number) => Promise<void> | void): Promise<{ submitted: number; summary: SmsImportDisplaySummary }> {
  const messages = await readPendingSms();
  if (!messages.length) return { submitted: 0, summary: smsImportDisplaySummary([]) };
  let submitted = 0;
  const responses: SmsImportResponse[] = [];
  for (let offset = 0; offset < messages.length; offset += 25) {
    const batch = messages.slice(offset, offset + 25);
    const imported = await importEligibleBankAlerts(request, batch, {
      platform: "android", nativeInboxAvailable: true, consentAccepted: true, allowedSenders: senders,
    });
    if (!imported.submitted) {
      await acknowledgeSms(batch.map(message => message.id));
      continue;
    }
    if (!imported.response) throw new Error("The SMS import returned no per-message results. Alerts remain queued for retry.");
    // Keep each batch encrypted until import results are decoded and the shared
    // transaction feed has refreshed successfully. Backend dedupe makes retries safe.
    await refreshTransactions();
    await acknowledgeSms(batch.map(message => message.id));
    submitted += imported.submitted;
    responses.push(imported.response);
    try { await onBatchComplete?.(smsImportDisplaySummary(responses), submitted); } catch { /* A local status display must not requeue a confirmed batch. */ }
  }
  return { submitted, summary: smsImportDisplaySummary(responses) };
}
