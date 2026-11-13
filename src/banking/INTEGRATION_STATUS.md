# Mono sandbox integration — October 14, 2026

## Implemented and inspected

- Supplied sandbox public key is configured in the existing local .env under
  EXPO_PUBLIC_MONO_PUBLIC_KEY and EAS development/preview profiles. No secret key
  was read, requested, logged or added. Production configuration is unchanged.
- Existing installed packages are Mono SDK 2.2.0, WebView 13.16.1, Expo 57.0.24,
  React Native 0.86.3 and React 19.2.3. WebView matches Expo's local bundled native
  module manifest; no packages were duplicated or core versions upgraded.
- Existing Link Bank Account routes open the existing native MonoSession. It
  uses MonoProvider scope auth, the signed-in customer's name/email, and
  useMonoConnect().init(). Installed SDK source confirms onSuccess supplies
  getAuthCode(); only that authorization code is submitted immediately to
  POST /api/bank-accounts/link as `{monoCode: code}` with Bearer auth. The code is
  held in callback/request memory only. SDK event payloads and codes are not logged.
- The existing authenticated bank request client refreshes a rejected session
  once, uses HTTPS, an explicit route/method allowlist, no-store and error-on-
  redirect. Raw server/SDK errors are not displayed. Rejected/possibly expired
  codes, 401, 409, 429, failed/pending responses and ambiguous network outcomes
  have safe messages. Only documented HTTP 200 can confirm link success.
- Duplicate success callbacks/concurrent POSTs are guarded. Successful linking
  followed by account-read failure offers only refresh, without resubmitting a
  code. Uncertain POST outcomes offer a read-only account check first. Cancellation
  exits the widget; leaving the screen aborts pending requests. Account-owner
  changes reset state and invalidate previous requests/callbacks.
- GET /api/bank-accounts is now the prioritized collection route. The dashboard
  reloads on focus/pull-to-refresh; Link Bank Account also loads on entry. Reload
  after restarting the app uses authenticated backend reads, not fabricated or
  locally cached linked accounts. Existing logo mapping and theme/card styling
  are retained.

## Response-dependent functionality is deliberately pending

Production Swagger was read during this task. It confirms:

| Endpoint | Documented contract |
| --- | --- |
| POST /api/bank-accounts/link | LinkBankAccountRequest with monoCode; HTTP 200; no success response schema |
| GET /api/bank-accounts | HTTP 200; no response schema |
| GET /api/accounts/me | HTTP 200; no response schema |
| POST /api/webhooks/mono | HTTP 200; no webhook body/security/processing schema |

Per the user's clarification, **no account response fields are assumed**.
bankAccountContract.decode remains null. A successful collection response
produces a clear "display pending schema" message rather than bank cards or
fabricated balances. The older parseLinkedAccounts helper is only a legacy
reference/test adapter, not the production decoder. Neither a successful POST
nor an undocumented DTO proves backend persistence, correct owner assignment,
Mono configuration or balances. The POST success response example is still needed.

Ask the backend developer for redacted actual successful responses for POST link
and GET /api/bank-accounts, its complete response/error schema, account ID types,
bank identity fields, masking policy, optional balance units/currency, pagination,
and processing/empty states. Then implement the exact decoder, update fixtures,
and test that linked records remain after restart. Do not map provider/customer
or bank identifiers to account IDs by guessing. Do not turn missing balances into
zero balances or infer NGN when currency is absent.

## Backend synchronization and persistence requirements

No backend repository or real authenticated device session was provided. Only
the existence of /api/webhooks/mono is established. The backend developer must
confirm exchange with the matching sandbox secret, ownership-scoped durable
storage, duplicate-link handling, webhook authenticity checks per Mono's protocol,
idempotent/out-of-order event processing and synchronization of account status,
balances and transactions. Clarify stale/pending/revoked connections and the
authoritative transaction-read contract. No new sync endpoint, background polling
or simulated automatic financial import is introduced.

## Expo and device status

Required Expo 54 docs were read before edits; the project remains on Expo 57.
Expo 57's official WebView documentation lists 13.16.1 and inclusion in Expo Go.
Use Expo Go matching this project's SDK for sandbox device tests. Mono's installed
package adds no separate native module beyond WebView.

A new custom EAS binary is needed **if the installed binary lacks WebView or has
an incompatible native version**; a JavaScript update cannot add native modules.
No binary was inspected, so its contents cannot be claimed. An internal preview
build carries the sandbox public key. A development-client build additionally
needs expo-dev-client, which is currently absent; it was not installed because
Expo Go/preview builds can run this integration without it. No build was submitted.

## Verification and remaining device checklist

Mocked request tests cover the exact SDK code/body, Bearer auth, one token refresh,
route allowlist, no redirect/cache, safe errors, uncertain/pending statuses and the
account-schema gate. Legacy parsing tests use synthetic fixtures only, and are
not a claimed bank response. TypeScript reports only the existing
absoluteFillObject errors in appp/(tabs)/_layout.tsx and appp/settings-dashboard.tsx.
Android and iOS production bundles exported successfully to
`.expo/mono-integration-check` with the installed Mono SDK included. No EAS
binary was built or uploaded. Exports verify bundling, not native/device behavior.

Files changed in this task: app/linkbank.tsx, components/MonoSession.native.tsx,
src/banking/backend.ts, src/banking/backend.test.cjs,
src/banking/useDashboardAccounts.ts, eas.json, src/banking/README.md, and this file.

No connected device or real Mono callback was available. Widget launch, sandbox
bank authentication/OTP, backend exchange, persisted account display, restart,
cancellation and updated balances have **not** been verified end to end. After
the DTO is supplied, test these on Android and iOS, including duplicate callbacks,
failed refresh after confirmed linking, expired codes, offline requests and logout
during linking. No real codes or bank credentials were submitted during tooling.

Sources: installed node_modules/@mono.co/connect-react-native/lib files;
https://www.npmjs.com/package/@mono.co/connect-react-native;
https://docs.expo.dev/versions/v57.0.0/sdk/webview/;
https://tallyspendapi-production.up.railway.app/swagger/v1/swagger.json.
