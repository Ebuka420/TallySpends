# Sandbox integration handoff — 15 November 2026

> Update, 19 November 2026: see [current backend status](src/BACKEND_STATUS.md)
> for the latest audit. Planning and coach history adapters now exist; analytics
> and help chat use backend responses, and production demo wallet code has been
> removed. Historical deferrals below are not a current integration checklist.

## Confirmed sandbox expense contamination — 19 November 2026

Inspection of the connected iPhone found 26 November expenses totaling
₦1,226,465.92, all with source `BankSync`, in the authenticated backend feed.
The app's bank integration is sandbox-only. The frontend now excludes these
records from the shared personal transaction feed, preserving Manual and Sms
records. Analytics summaries are withheld for accounts containing sandbox bank
rows because the current summary response cannot separate test and real activity.

Backend work: identify and remove sandbox records within the correct authenticated
user scope, retain explicit account/transaction environment provenance, and exclude
sandbox activity from personal analytics and spending aggregates. No backend rows
have been deleted by the frontend. Do not promote historical sandbox data by merely
switching Mono keys; live-bank support needs a documented provenance contract.

The supplied **TallySpend API Contract for Frontend (1).pdf** and wallet message
resolve the earlier response-schema requests for wallet, recipients, Mono,
manual transactions, profile, budgets, savings, Ajo and chat. This supersedes
the earlier Swagger-only handoff. No new schemas are needed for the wallet work.

## Implemented in the frontend

- Wallet balance and latest 50 ledger entries use server amounts/statuses. The
  home wallet card opens the wallet screen. Tracker balances remain separate.
- Virtual-account GET handles 404; explicit Create calls the idempotent POST.
- TallyTag/payment-ID/QR lookup verifies the server recipient and rejects self
  payments. Confirm sends `POST /api/wallet/send` with integer kobo.
- Bank transfers use `POST /api/wallet/transfer`, then GET status for Pending.
  A manual bank-code/account-number form supports sandbox testing. Bank picker
  and pre-transfer name lookup are **deferred at the user's request**.
- Both payment flows save one key and the exact draft per account before sending.
  Uncertain retries reuse them across screen changes and restarts. P2P retries
  replay the same POST; bank polling reads status. No demo transaction is added.
- Refresh is shared by profile, banking, QR, chat, notifications, feedback,
  Youngins, password changes and wallet. Refresh 401 clears credentials and
  authentication. Password-change/verification token rotation is also preserved.
- Profile focus no longer opens a repeated sign-in alert; temporary failures
  display a retry message. Address remains backend-backed; adult NIN is mocked.
- Mono sends `{ monoCode }`, decodes the documented response and checks that
  the returned account ID is Linked in the subsequent account list. Null balances
  remain unavailable, rather than becoming zero.
  Mono is configured with a sandbox public key: its accounts/balances are sample
  data, explicitly labeled in the link flow and dashboard cards. The local Expo
  key is in ignored `.env.local`, matching the existing EAS development key.
- Dashboard cards now use native horizontal scrolling in both directions, plus
  arrows and tappable selectors. The previous right-only gesture rejected left
  swipes toward the peeking card. Account selection is preserved across refreshes;
  dashboard requests use the same stable account scope as the linking screen.
- The Add action opens Record a transaction: Income/Expense, documented category
  IDs 1–6 and method IDs 1–4, POST 201 bare ID, then GET list confirmation.
  Unknown outcomes are not automatically posted again. Existing local entries,
  receipt scanning and budget-local recording are not migrated by this change.

## Verification and remaining work

### New-account planning and profile completion

Local planning documents are now scoped to the authenticated profile owner.
New accounts start with no plans, transactions or demo opening funds. Old
device-wide `ts_demo_wallet_v1` and `ts_txs` records remain untouched, but cannot
be automatically attributed to any user and are no longer shown by this flow.
Existing per-owner plans reload when that owner returns. Empty activity shows
"No insights yet" rather than rotating zero-value statistics.

Profile now links to `/complete-profile`. Address saving remains server-backed;
NIN stays a placeholder and BVN is "Coming soon", as requested. No NIN/BVN
numbers are collected. Backend verification contracts remain needed for both.

### Smart Coach attachments

The plus menu, camera capture, photo/PDF selection, thumbnails, removal and local validation are
implemented. Proposed product limits: 3 files per message, 5 MiB per file, photos
(JPEG/PNG/WebP/HEIC/HEIF) and PDF only; no videos. Confirm supported formats and
limits on the server, including content validation and any HEIC conversion needs.

Live Swagger currently defines `POST /api/chat` as JSON `{ message }` with
`additionalProperties: false`, and has no upload endpoint. Please provide the
authenticated upload/message contract (multipart or attachment IDs), responses,
and attachment metadata in chat history, plus deletion/retention behavior.
The UI explicitly labels selected files as not sent and blocks sending while
attachments are selected. Text-only chat remains available after removing them.
Files are not uploaded, embedded into the message text, or saved in chat history.

### Unlinking bank accounts

The live Swagger specification checked on 15 November 2026 exposes only
`GET /api/bank-accounts` and `POST /api/bank-accounts/link` for bank connections.
The supplied contract also has no unlink endpoint. Please provide an authenticated
unlink endpoint for a specific account ID, its success/error responses, and confirm
whether it revokes the Mono connection and stops synchronization. Document whether
the account then disappears from GET or returns with status Disconnected, and what
happens to historical transactions. Enforce ownership from the JWT.

The frontend unlink action is pending this contract; no local-only removal has
been added. Once available, the UI can confirm the selected account, unlink it,
refresh the account list, and move dashboard selection if necessary.

### Dashboard account scope and duplicate-account report

The user reports linking only Zenith but seeing three additional Zenith entries,
PalmPay and GTBank. The dashboard's bank records are obtained from authenticated
`GET /api/bank-accounts`; the local bank catalogue only supplies logos. The UI
now excludes Disconnected records. The response from this user's device has not
been captured, so the cause of the extra records is not established.

Backend follow-up: inspect that user's bank-account rows and request ownership.
Confirm the list is filtered by the JWT user, remove erroneous sandbox seed/link
records after identifying them, and make duplicate Mono links return the existing
account as documented. Include a stable external-account identifier or masked
account number so multiple genuine accounts at one bank can be distinguished.
Do not deduplicate solely by bank name or hardcode Zenith in the frontend.

The selected dashboard card now controls recent activity and Smart Insights.
The wallet uses only its actual ledger (posted totals within the latest 50 rows);
bank cards never inherit the combined transaction feed. Hardcoded food/spending/
savings examples were removed. The current bank list DTO has no transactions,
and `GET /api/transactions` has no `accountId` or documented account filter.
Provide account-scoped transaction data or a documented `accountId` association
before bank-specific cash flow can be populated. Until then those stats display
unavailable. Budgets, savings and Ajo similarly have no bank association; their
existing cards show this instead of presenting personal plan totals as bank data.

Contract tests use synthetic data and mocked transport. They cover concurrent
refresh, rejected refresh, cancellation/logout races, recipient lookup,
integer amounts, transfer persistence/retry, pending/failure, account isolation,
Mono exchange/readback decoding and manual income/expense POST plus GET.
TypeScript and Expo bundle checks do not establish deployed API success.

**Live tests are not completed.** No signed-in device/emulator session or test
credentials are available to this workspace. Signing in on a separate Expo phone
does not give the coding workspace that session. No real HTTP success responses
for Mono linking or manual creation have been captured or sent to the backend.

Next device checks:

1. Sign in, visit Profile repeatedly, and confirm refresh requests stop after a
   rejected refresh. A failed refresh should return to login once.
2. Open the home wallet card, create/reload the account number, add sandbox test
   funds, then refresh balance/history.
3. Pay a second sandbox user after verifying the displayed name. Retry an
   interrupted payment and confirm one debit with the same key.
4. Use backend-supplied sandbox bank details; verify Pending then Completed or
   Failed and the actual balance/ledger. Reopen the app during Pending.
5. Complete Mono Connect and capture redacted POST link/GET list responses.
6. Record one income and one expense using Add; capture their request bodies,
   POST IDs and matching GET records. Do not include JWTs or Mono codes.

Separate remaining integration work: server-backed planning and chat history,
the Youngins approved notice/version, referral/subscription lifecycle and push
delivery/logout token ownership. These are outside this wallet implementation;
the newly supplied PDF should be used for the planning/history adapters.
