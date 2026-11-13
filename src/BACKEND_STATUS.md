# Backend readiness — checked 20 October 2026

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
