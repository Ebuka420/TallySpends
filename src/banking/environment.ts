// The bank integration currently accepts Mono test_pk_ connections only.
// Keep historical BankSync records out of personal totals even if a key changes.
// Production banking needs backend provenance for each account/transaction before
// this policy can change; a production key alone does not make old test rows real.
export const bankSyncUsesSandbox = true;

export function isSandboxBankTransaction(transaction: { source?: unknown }) {
  return bankSyncUsesSandbox && typeof transaction.source === "string"
    && transaction.source.trim().toLowerCase() === "banksync";
}
