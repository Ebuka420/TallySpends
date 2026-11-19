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
- The shared personal transaction feed powers Expenses, history, dashboard recent
  activity and transaction-based insights. It contains validated server records
  only; it never merges local demo records or seeds.
- Bank linking currently supports Mono sandbox only. `BankSync` records are
  excluded from personal income/expense totals at the shared API boundary, with
  an excluded-record count scoped to the signed-in account. Manual and SMS
  records retain their original amounts. Expenses explains the exclusion.
  `src/banking/environment.ts` records this integration policy. Changing a Mono
  key must not reclassify historical sandbox rows as real transactions.
- Analytics uses a separate backend summary. Until that endpoint supports
  excluding sandbox activity, it is unavailable for accounts with sandbox
  `BankSync` rows, including report exports. No replacement health score,
  trend or total is invented.
- Budget spending is attributed only when category and date select exactly one
  budget (or an existing local transaction explicitly carries that budget ID).
  This attribution is display-only and does not debit a wallet or alter
  account balances. Null/ambiguous categories remain unattributed.
- SMS results display backend status and counts only; full SMS text and parsed
  personal content are not put in the result text or AsyncStorage. A batch
  remains encrypted until the import response is decoded and the transaction
  feed refresh succeeds. Backend deduplication makes retrying safe.
- Android capture remains RECEIVE_SMS-only, sender-allowlisted and consented.
  Eligible messages are encrypted locally and uploaded only when the app is
  foregrounded, signed in, and unlocked. iOS inbox behavior is unchanged.

## Remaining contract and release limits

- Manual entry uses authenticated `POST /api/transactions`, validates the returned
  ID, and confirms the new record via GET. Unknown POST results are not replayed.
- Live banking needs backend account/transaction provenance identifying sandbox
  versus live records, plus source-filtered analytics. Existing sandbox rows must
  be identified and cleaned up server-side within the correct user's scope.
  There is no documented transaction DELETE endpoint; the frontend has not
  deleted backend records or attempted to infer real bank activity by amount.
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
statuses/counters, message filtering, account-scoped feed refresh, sandbox exclusion,
preservation of manual/SMS records, and safe budget attribution. TypeScript
`--noEmit` is also required. No authenticated production response or real SMS
device test is performed by the unit suite.
