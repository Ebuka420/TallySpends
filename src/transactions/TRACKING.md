# Automatic transaction tracking

## Confirmed backend contract

- `GET /api/transactions` returns a direct JSON array with `id`, `amount`,
  `currency`, `transactionType`, `categoryName`, `vendorName`,
  `paymentMethodName`, `description`, `isRecurring`, `source`, and
  `transactionDate`. Amounts are NGN naira, `transactionType` is `Income` or
  `Expense`, and dates are UTC. `vendorName` may be null. The endpoint returns
  newest first.
- `POST /api/sms/import` accepts `{ messages: [{ sender, body, receivedAt }],
  accountId?: integer }` and returns HTTP 200 with `imported`, `duplicates`,
  `ignored`, `unparsed`, and `results[]`. Results contain `index`, `status`,
  nullable `transactionId`, and nullable `parsed`. The supported statuses are
  `Imported`, `Duplicate`, `Ignored`, and `Unparsed`.
- Sources include `Sms`, `BankSync`, and `Manual`. The backend owns SMS parsing,
  transaction creation, duplicate detection, and transaction IDs.

## Frontend behavior

- `src/transactions/api.ts` validates these response shapes and maps
  `transactionType` directly to income/expense. It never infers type from an
  amount sign or converts a naira amount more than once.
- The authenticated GET feed is held in memory by signed-in account scope and
  refreshes on sign-in, app resume, dashboard/history focus, explicit refresh,
  and after successful SMS imports.
- The same merged transaction feed powers transaction history, dashboard recent
  activity, analytics, spending rhythm, and read-only budget spending summaries.
- The existing local wallet, manual rows, budgets, receipts, savings, and
  balances are not reset or migrated. Synced rows replace local rows with the
  same stable ID; local rows with different IDs remain visible as `LocalManual`.
  Untouched built-in sample transactions are hidden only after a successful
  backend feed loads. Edited sample records are preserved. No fuzzy matching by
  amount, date, or description is used.
- Budget spending is attributed only when category and date select exactly one
  budget (or an existing local transaction explicitly carries that budget ID).
  This attribution is display-only and does not debit the demo wallet or alter
  account balances. Null/ambiguous categories remain unattributed.
- SMS results display backend status and counts only; full SMS text and parsed
  personal content are not put in the result text or AsyncStorage. A batch
  remains encrypted until the import response is decoded and the transaction
  feed refresh succeeds. Backend deduplication makes retrying safe.
- Android capture remains RECEIVE_SMS-only, sender-allowlisted and consented.
  Eligible messages are encrypted locally and uploaded only when the app is
  foregrounded, signed in, and unlocked. iOS inbox behavior is unchanged.

## Remaining contract and release limits

- The app's existing manual transaction entry writes only to its local wallet.
  No successful POST `/api/transactions` create/update response contract was
  supplied, so existing and new device-only manual rows are preserved locally
  and are not uploaded. To make manual entry server-authoritative across
  devices, the backend must document its authenticated create route, exact
  request/response DTO, stable ID behavior, and idempotency key semantics.
- The transaction DTO has `categoryName` but no category ID or budget ID. Exact
  category/date matching updates only unambiguous budget summaries; reliable
  budget assignment needs a stable category/budget reference from the backend.
- Transaction events alone cannot establish a current account balance without
  an opening balance and complete account-balance contract. The overview
  balance is not derived from transaction totals. The successful
  `GET /api/bank-accounts` response schema remains a separate integration item.
- Google Play's sensitive SMS permission declaration/review and real-device
  native SMS tests are still required. No Play approval or live production
  import test is claimed.

## Validation

`node --test src/transactions/tracking.test.cjs` covers direct-array decoding,
Income/Expense mapping, null values, malformed and non-NGN data, SMS response
statuses/counters, message filtering, account-scoped feed refresh, local manual
preservation, safe budget attribution, and no fuzzy duplicate matching. TypeScript
`--noEmit` is also required. No authenticated production response or real SMS
device test is performed by the unit suite.
