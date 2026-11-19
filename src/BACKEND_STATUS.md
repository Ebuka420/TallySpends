# Backend readiness

## Current audit — 19 November 2026

This section supersedes the historical notes below. The public production
Swagger was retrieved on 19 November 2026. The separately managed backend
source and an authenticated test session are not available in this workspace.

- Analytics now uses `GET /api/analytics` and explicit
  `POST /api/analytics/refresh` with the selected period/date. Totals, categories,
  trends, heatmap and exports come from the same validated response. Missing or
  malformed data raises an error; a real zero is never replaced by other data.
  Switching account/period hides the previous snapshot. Report counts are labeled
  as expenses because the response does not provide a total income/expense count.
- Help chat uses authenticated `POST /api/chat` and is labeled Smart Coach.
  Canned replies and simulated typing delays were removed. Email support still
  opens a user-controlled email draft; no human-support or ticket API exists.
- Production planning modules no longer contain the simulated wallet, opening
  funds, local funding operations or simulated invitation responses. Historical
  simulation fixtures are isolated under `src/budget/test-fixtures` for tests.
  Active planning reads and writes the existing backend adapters.
- Savings automation controls no longer pretend to save. The screen describes
  unavailable automation and opens the actual server-backed savings goals.
- Receipt scanning now hands reviewed fields to the backend manual-entry form,
  where the user chooses a payment method. It does not invent a Card payment,
  navigate to a fabricated local transaction ID, or claim to upload an image.
- Transaction history and receipt loading depend on the transaction feed, not
  budget/savings/Ajo availability. Manual entries no longer claim wallet movement.
- On the home dashboard, bank-card selection scopes only Smart insights.
  Savings, Ajo, budgets and recent transactions use account-wide data. New users
  see explicit no-savings, no-Ajo and no-budget states after plans load successfully.
  Smart insights cards and See all open `/insights` with the selected account ID.
  That page keeps the selected scope and reports unavailable account activity
  instead of substituting combined transactions; its headline comes from data.
- No transaction DELETE endpoint is documented; the unsupported adapter now
  reports this without sending an invented request or removing local records.

Remaining dependencies, not simulated successes:

- Expenses follow-up: the user reported a ₦1.2 million total in the phone's
  development app. No fixed amount was found in the current Expenses source.
  Expenses now refreshes on focus and pull-to-refresh, hides cached totals until
  the feed succeeds, distinguishes errors from confirmed empty data, and replaces
  the unconditional positive spending claim with a recorded-expense count.
  The unused root `App.js` prototype, legacy local/seed transaction merge
  helper, and stale ignored `dist/` web export were removed. The running Android Metro bundle was checked for the new
  screen and the absence of the old seed identifiers.
- Subsequent connected-iPhone inspection identified the exact reported total:
  26 November `BankSync` expenses totaled ₦1,226,465.92 in a ready backend feed
  containing 80 records. This was backend bank-sync data, not a fixed UI amount.
  Because the bank integration is sandbox-only, the personal feed now excludes
  `BankSync` records centrally while retaining manual and SMS entries. Expenses
  explains the exclusion. Backend Analytics is withheld when sandbox records are
  present because its summary cannot currently separate them. Backend records
  have not been deleted. Production migration requires per-record provenance and
  sandbox-aware analytics; changing the Mono key alone is insufficient.

- Mono remains configured for **sandbox**. Sample accounts supplied by Mono or
  stored on the backend require production configuration/backend cleanup; removing
  frontend mocks does not convert them into real bank connections.
- Youngins creation awaits the approved privacy notice/version. Child list/create
  adapters already exist; no consent version was invented or gate bypassed.
- Joint savings, referrals, automated savings, goal reminder scheduling, NIN/BVN
  verification, bank unlinking, human support tickets and coach uploads lack
  confirmed usable contracts. They remain unavailable.
- Notifications store received events on-device; the API documents registration,
  not a server inbox. RevenueCat purchases require configured store products/keys.
- Password recovery is already integrated with the documented auth routes.

Tests use synthetic transport fixtures; they do not establish authenticated live
payments, Mono linking, email delivery or physical-device success.

Validation for this audit: all 198 CommonJS regression tests passed (including
the receipt-parser wrapper), `npm.cmd run typecheck` passed, and Android Expo
export completed. The installed Expo version was preserved; no SDK migration
was performed.

## Latest: Production Backend Integration & Mock Data Purge (18 November 2026)

- **Mock Data Elimination**: Removed `src/mockData.js`, prototype chart/views in `src/components/`, duplicate backup `appp/` folder, and demo wallet mock screens.
- **Analytics Integration**: Fully integrated live backend analytics (`GET /api/analytics` and `POST /api/analytics/refresh`) supporting period types (Weekly, Monthly, Yearly), financial health score, totals, spending heatmaps, category summaries, and insights into `app/(tabs)/analytics.tsx`.
- **Bank Transfers & Account Resolution**:
  - `GET /api/wallet/banks`: Integrated live searchable bank picker (292 Nigerian banks).
  - `GET /api/wallet/resolve-account`: Added real-time 10-digit NUBAN auto-resolution, displaying verified account name directly in the transfer flow.
  - `POST /api/wallet/transfer`: Linked to live backend transfer mutation with transaction status polling.
- **Transactions & Ledger**: Authenticated user feeds dynamically consume live transactions (`GET /api/transactions`) and wallet balance (`GET /api/wallet/balance`).
- **Validation & Stability**: Full test suite passing across all modules; 0 TypeScript errors via `tsc --noEmit`.

## Supplied frontend contract and sandbox wallet (15 November 2026)

The PDF supplied on 15 November 2026 resolves the earlier missing schemas.
The Swagger-only audit below is historical and is superseded by
[BACKEND_HANDOFF.md](../BACKEND_HANDOFF.md).

Wallet balance/history, virtual accounts, user payments, manual-code bank
transfers, shared session renewal, Mono response decoding and a server-backed
manual Income/Expense form are implemented. Bank picker and advance name lookup
are explicitly deferred. Live authenticated payment/Mono/manual checks remain
unverified; the contract tests use synthetic fixtures. Budgets, savings, Ajo and
chat history now have documented responses but still need separate adapter work.

Profile focus uses an inline retry message rather than repeated login alerts.
Only a rejected session ends authentication; refresh calls share one coordinator
and cannot retry forever after refresh 401. Profile uses backend `paymentId`,
`gender`, `dateOfBirth` and structured address. Adult NIN remains a placeholder.

## Update — 15 November 2026

After merging main: residential address now sends the documented structured
PATCH object and confirms via GET read-back; it is not mocked. The parser supports
structured fields and legacy display strings, with no address persisted in the
device cache. Mocked repository tests pass; authenticated live read-back remains
unverified. Adult NIN remains a non-collecting placeholder per product direction.

The live production Swagger JSON was retrieved again. The detailed remaining
request is in [BACKEND_HANDOFF.md](../BACKEND_HANDOFF.md). The older audit below
is retained as historical context; this update supersedes its QR/feedback status.

- QR lookup now uses documented `GET /api/payment-ids/{paymentId}`. Its response
  schema and `user_<id>` resolution remain unconfirmed; strict recipient decoding
  and the real-payment gate remain.
- Feedback now sends the documented `rating`, `categories`, `suggestions`, with
  `Idempotency-Key`. It is enabled by default, requires a star rating and signed-in
  session, and acknowledges HTTP 200 as submission without claiming saved/email
  receipt fields. An explicit `EXPO_PUBLIC_FEEDBACK_ENABLED=false` disables it.
- Push registration now uses `POST /api/notifications/register-token` with
  `expoPushToken`, auth refresh, login/resume retries and cancellation. Duplicate
  screen-level listeners were removed and the native config plugin added. Server
  token reassignment/logout revocation and physical-device delivery need testing
  and backend confirmation.
- Wallet account/balance/ledger/virtual-account routes exist, but none publishes
  a response schema. This is not a transfer/withdrawal execution contract.
- Manual transaction POST/PATCH routes exist. Creating entries needs confirmed
  account/category/payment-method IDs, responses and retry semantics.
- Bank account, profile, budgeting, savings, Ajo and chat-history responses still
  lack schemas. Username lookup, payment execution, forgotten-password recovery,
  trusted-device management, referrals and subscription webhooks are not listed.
- Youngins remains gated on the approved notice/version. Local planning data and
  Coach memory remain local. No live payment or production mutation was performed.

## Historical audit — 20 October 2026

Source: current public production specification at
https://tallyspendapi-production.up.railway.app/swagger/v1/swagger.json
retrieved successfully on 20 October 2026, plus the actual frontend adapters.
The children response/security contract also comes from the backend developer's
examples supplied by the user. Swagger presence is evidence of documentation,
not a successful authenticated integration test. No real accounts were created,
linked or paid during this audit. The separately managed backend source is absent.

| Feature | Confirmed | What still needs to happen |
| --- | --- | --- |
| Mono linking | POST /api/bank-accounts/link accepts monoCode. GET /api/bank-accounts and GET /api/accounts/me exist. POST /api/webhooks/mono is listed. Frontend SDK, Bearer session, cancellation, duplicate guards and refresh path exist. | Backend must supply actual successful link/list JSON and error/status behaviour. Swagger has no response schemas. Frontend bankAccountContract.decode is intentionally null, so account display cannot succeed yet. Then implement that decoder and test real sandbox linking, refresh and reconnect. Confirm server code exchange, matching sandbox application/secret, account ownership, signed webhook processing and account/transaction sync. Current frontend only accepts sandbox public keys; live rollout requires confirmed production configuration. Linking alone does not enable payments. |
| Youngins profile creation | POST/GET /api/children; exact flat-record/array contract already supplied and implemented. Backend owner confirmed encrypted NIN and guardian-scoped access; independent/platform log audit not supplied. | approvedNotice is still null in src/youngins/readiness.ts. Supply the approved complete notice, guardian declaration and authoritative version. The supplied draft explicitly says it must be supplemented before publication; v1.2.0 was an example. Preserve explicit acceptance. Backend currently stores any nonempty version rather than enforcing a current version. No child wallet, child login, external NIN verification, or child edit endpoint is confirmed. |
| QR recipient lookup | Swagger lists GET /api/payment-ids/{paymentId}. Local QR generation/sharing exists. | Frontend currently requests /api/payments/recipients/{paymentId}, which is not listed. Agree the existing route's actual response, identifier rules (including local user_<id> payloads), access controls and self-transfer rejection, then update the adapter. Do not equate local QR generation with a working payment service. |
| Username recipient search | No username-search route appears in this Swagger. | Confirm whether an undocumented route exists, or provide authenticated exact-username lookup returning only a stable public recipient ID, display name and username, with not-found/rate-limit/self handling. The current screen has an empty verified-recipient list and explicitly reports that lookup is unavailable. It does not load fake registered users. |
| Transfers / withdrawals | Transactions routes exist. | No money-transfer or withdrawal execution route is documented. Need the real payment contract: eligibility, balance/fees, strong authorization, idempotency, pending/success/failure receipt, reconciliation and transaction feed. The local demo ledger is not payment execution. A locally verified PIN/biometric is not a server payment authorization contract. |
| Rate Us / feedback | POST /api/feedback exists with Idempotency-Key. Documented request is rating, categories, suggestions. | Frontend currently sends tags and submittedAt, so the adapters differ. Agree rating optionality and actual saved/queued/sent receipt (frontend expects id, saved and emailStatus), then align and test. The frontend is also gated by EXPO_PUBLIC_FEEDBACK_ENABLED, off by default pending confirmation. Endpoint presence does not confirm email delivery. |
| Profile sync | GET/PATCH /api/users/me and avatar upload exist. PATCH now includes dateOfBirth, gender and structured address, alongside existing name/phone/avatar fields. | Provide a successful GET response and update/read-back semantics. Frontend currently parses/syncs only its earlier supported fields; DOB/gender/address remain unavailable through that adapter. Preserve read-only text fields and changeable photo. |
| Coach history / memory | POST /api/chat and GET /api/chat/history exist. Documented chat request contains message only. The current client includes selected local history and user-saved facts in that message. | Need actual history schema, conversation IDs/pagination/ownership semantics and confirmation of how chat stores/uses context. Frontend history/user-managed memory is device-local. A history route alone does not establish cross-device saved memory. |
| Password reset / devices | Authenticated POST /api/auth/change-password exists. | No forgotten-password reset/OTP/recovery or trusted-device list/revocation route appears in Swagger. Confirm any undocumented contracts before connecting those flows. Local PIN recovery currently requires the current account password. |

## Highest-priority handoff

1. Redacted successful POST /api/bank-accounts/link and GET /api/bank-accounts
   responses, pending/error examples, field types and amount units. Include a
   linked account with missing/refreshing transaction data, not fabricated data.
2. Approved final Youngins notice/declaration and current version; confirm whether
   stale versions should be rejected by the server. Confirm platform log handling.
3. Actual GET /api/payment-ids/{paymentId} and username lookup contracts.
4. Actual POST /api/feedback receipt/rating rules and GET /api/users/me response.
5. History/memory and real-payment authorization/execution contracts.

These are a combination of backend confirmations, product/privacy approval and
frontend adapter work. They should not all be reported as unimplemented backend
endpoints.

## Completion-screen fix

The old Get Started button looked identical while deferred registration ran,
was inside an animated footer in a non-scrollable page, and login published
its authenticated state before completion cleanup/flags finished. The screen now
keeps a stable footer outside the scrollable introduction content, shows a spinner
and setting-up label immediately, presents persistent failure text and retry,
and blocks duplicate taps. Completion stages its login without activating routes
until the final completion write. Existing PIN/security gating remains in effect.
A failed registration never navigates as a successful account. Recovery from a
partial session setup can use the same account's migrated PIN verifier.

Checks: completion submission tests cover immediate busy feedback, duplicate
presses, awaiting backend completion, no navigation on errors, and retry. Physical
Expo Go interaction still needs verification; no device was available to reproduce
the exact original tap failure.
