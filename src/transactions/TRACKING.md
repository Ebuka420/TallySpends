# Automatic transaction tracking: implementation and handoff

Inspected production Swagger on 20 October 2026. This is a partial integration,
not an active automatic-import feature. No authenticated live financial writes
or real SMS imports were performed.

## Confirmed implementation

- Existing Mono Connect sandbox flow exchanges the code through authenticated
  POST /api/bank-accounts/link with `{monoCode}`. Existing cancellation, timeout,
  token refresh and error behavior are preserved.
- GET /api/bank-accounts exists, but its response decoder remains disabled until
  an actual successful response contract is supplied. An HTTP acknowledgement
  alone cannot prove that transaction history is ready.
- GET /api/transactions exists with from/to, categoryId, vendorId, minAmount,
  maxAmount, paymentMethodId and transactionType filters. No success DTO is
  documented. POST and PATCH request DTOs are not response specifications.
- POST /api/sms/parse accepts `{sender, body, receivedAt}`. POST /api/sms/import
  accepts `{messages: [{sender, body, receivedAt}], accountId?: integer}`.
  Neither documents a response, durable receipt, or duplicate/retry behavior.
- POST /api/webhooks/mono exists. Swagger cannot establish that it verifies
  webhook secrets, imports all pages, schedules refreshes, or reconciles SMS.
- History, expenses, analytics and spending rhythm consume store.transactions,
  which comes from the persisted local demo wallet. Budget commands also use
  that wallet. Its transactions affect a calculated demo balance. Remote bank
  entries must not be inserted through saveWalletTransaction/addTransaction.
- Smart Coach POST /api/chat accepts a message. There is no confirmed backend
  guarantee that it reads imported transactions. Require backend confirmation
  rather than transmitting a full financial feed in the chat prompt.

## Changes in this task

- Transaction history links to a neutral, theme-compatible tracking status page.
  It reports inactive imports, no confirmed sync, existing linked-account access,
  and platform-specific SMS limitations. No false active switch or sync date.
- The status page retries the documented authenticated GET /api/transactions,
  reusing the bank client's HTTPS/route allowlist, token refresh and timeout.
  Unknown response shapes fail clearly without altering manual transactions.
  This is an availability check, not a provider refresh or successful sync.
- Pure SMS candidate filtering requires Android, an available native reader,
  distribution approval, explicit consent, and an explicit bank-sender allowlist.
  It excludes common OTP/security messages and requires a debit/credit monetary
  alert. It preserves original sender/body/timestamp and discards extra fields.
  It collapses exact within-batch repeats only; it never merges equal amounts.
  This is defense in depth, not a guarantee against every possible sensitive SMS.
- No inbox permission, native reader, SMS upload, raw-message storage, retry queue,
  financial import, recategorization write, or background sync was enabled.
  No new dependencies or environment variables.

## Backend developer: required confirmations

1. Supply anonymized successful bank list, transaction list and detail, SMS
   parse/import, and category-update responses. Specify collection envelope,
   pagination/completeness, stable IDs, account ownership, source identifiers,
   currency, naira/kobo units, debit/credit enum, settled/pending/failed status,
   timestamps/timezones, categories and canonical transaction references.
2. Confirm that linking waits for data availability or returns an explicit
   pending status. Confirm durable account ownership and historical import.
3. Confirm server-side Mono webhook secret validation, job scheduling, pagination,
   retries, disconnect/reauthorization handling, and sync-state metadata including
   last successful sync and pending/error state. If app-triggered sync is supported,
   document its existing route and receipt; do not substitute analytics refresh.
4. Document durable SMS import receipts, per-message rejection reasons, maximum
   batch size, account binding, retention/log redaction and idempotency. Lost HTTP
   responses must not create duplicates on retry. Parsing alone is not persistence.
5. Reconcile Mono and SMS into canonical server transactions. Provider IDs and
   references should drive matching; account, amount, direction and time alone
   are not sufficient proof. Do not merge separate equal-amount purchases.
6. Supply category IDs/catalog and PATCH confirmation behavior for corrections;
   clarify how budgets and coach consume canonical bank expenses and income.

After these are confirmed, implement an owner-scoped canonical remote feed
separate from the demo ledger, publish it consistently to history/analytics/
budget spending, and preserve user-entered rows with explicit provenance.
Do not derive bank balances from imported transaction totals. Do not deduplicate
manual entries against bank entries using fuzzy amount matching.

## Platform and release requirements

Current Android config has camera/audio permissions and no SMS reader module.
Expo Go cannot acquire a custom inbox reader by adding JavaScript. A reviewed
native Android module/config plugin and a new development/release build are
needed, with permission revocation, logout cancellation, scoped cursors and
encrypted minimal retry state designed before enabling collection. Do not
persist full SMS bodies to AsyncStorage or log them. Stop collecting immediately
when consent is withdrawn. Do not add permissions until the release is eligible.

Google Play restricts SMS permissions. SMS-based money management may qualify
for an exception, but approval/declaration is required, not assumed:
https://support.google.com/googleplay/android-developer/answer/10208820

Expo SMS opens the sending composer; it is not an inbox-reading API:
https://docs.expo.dev/versions/latest/sdk/sms/
iPhone automatic tracking must use bank synchronization, not unrestricted SMS
inbox access. No iOS SMS permission prompt should be introduced.

Mono account availability and refresh jobs must be handled server-side; a
connected account does not imply immediate complete transaction availability:
https://docs.mono.co/docs/financial-data/account-update
https://docs.mono.co/docs/financial-data/realtime-data

Existing EXPO_PUBLIC_API_URL and EXPO_PUBLIC_MONO_PUBLIC_KEY configuration is
unchanged. Mono secret/webhook keys belong exclusively on the backend.

## Validation

Run tracking.test.cjs with the installed Node executable. It tests platform,
consent, native/distribution gates, sender allowlisting, common sensitive-message
exclusion, missing amounts, invalid timestamps, exact repeats, distinct equal
amounts, response rejection and network failure. Run banking/backend.test.cjs
for existing exchange, refresh, masking and error regressions.

In Expo Go: open Transaction history > Automatic tracking. Confirm inactive
status, linked-account navigation, iPhone limitation text, service-check loading,
offline/timeout recovery and unchanged manual history. No native build is needed
for these status changes.

Pending contract/device integration tests: historical and newly synced bank
transactions; debit/credit normalization; pagination; duplicate webhook delivery;
Mono/SMS reconciliation; lost-response retries; disconnect/expired consent;
category correction; budget/analytics/coach updates without double counting;
user-switch isolation; Android permission denial/revocation and consent removal.
These cannot honestly be reported as passing with undocumented responses and
no authenticated bank fixture. Use anonymized backend fixtures before real data.
