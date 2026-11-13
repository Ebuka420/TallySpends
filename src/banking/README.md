# Mono sandbox bank linking

**Current status (October 14):** [INTEGRATION_STATUS.md](./INTEGRATION_STATUS.md)
supersedes the historical retrieval details below. GET /api/bank-accounts is now
documented and prioritized. Account display is intentionally pending until the
backend supplies its actual successful response schema; no proposed adapter is
used in production. Local and EAS development/preview sandbox keys are configured.

Dashboard carousel behavior, data limitations and backend requirements are documented in [DASHBOARD.md](./DASHBOARD.md).

The existing More → Link Bank Account entry opens Mono using `MonoProvider` and `useMonoConnect().init()`. Mono handles bank selection, authentication and authorization. The native SDK is isolated in `components/MonoSession.native.tsx` to preserve the web bundle. Expo 57.0.24, React Native 0.86.3, React 19.2.3, Mono SDK 2.2.0 and WebView 13.16.1 were already installed. WebView matches Expo 57's manifest and official documentation. Mono declares unrestricted React/React Native peers and WebView >=6.0.2; physical-device verification is still needed. The required Expo 54 docs were read before edits; no Expo migration was made.

## Sandbox configuration

- Local `.env` sets `EXPO_PUBLIC_MONO_PUBLIC_KEY` to the supplied sandbox public key. Restart Metro with `npx expo start --clear` and reload Expo Go.
- The EAS development profile sets the same public environment variable because `.env` is gitignored. Production profiles were not enabled for Mono. The frontend accepts only keys starting with `test_pk_`.
- The signed-in user's profile full name and email are used as Mono customer details.
- The backend must use the corresponding sandbox application's secret key. Never include a Mono secret in the frontend.

The callback reads `getAuthCode()` and sends `POST /api/bank-accounts/link` with `{ "monoCode": "<authorization-code>" }`. Only the backend exchanges that code with Mono and persists the link. Temporary codes are neither logged nor persisted. Completed HTTP responses confirm linking; HTTP 202 and explicit failed/pending JSON outcomes do not show success.

Requests reuse `src/api.ts`, bearer authentication, the existing `/api/auth/refresh` contract and store `login` for rotated tokens. Requests time out after 30 seconds and abort on unmount. Success requires backend confirmation followed by account refresh; a failed refresh after confirmation retries only the refresh. Account records are held in memory for the screen instance.

Duplicate callbacks and concurrent submissions are blocked. Unknown network outcomes require checking accounts before relinking. The UI retains the existing styling and primary color #20142A.

## Verified deployment; retrieval schema still needed

On October 9, 2026, the deployed Swagger specification now lists `POST /api/bank-accounts/link` with `LinkBankAccountRequest.monoCode` as a string and HTTP 200 on success. An unauthenticated empty POST returned HTTP 401 with `WWW-Authenticate: Bearer`, confirming the previous deployment blocker is resolved. The frontend already uses this exact endpoint/body and its authenticated client attaches the user's bearer token. Swagger does not document the successful response body. Authenticated end-to-end linking has not been verified; no real code or credentials were sent during these checks.

Swagger lists `GET /api/accounts/me`, so that existing route is used for refresh. **Its bank-account semantics and response schema still need backend confirmation.** The adapter accepts an array or `{ accounts: [...] }` containing string `id`, `bankName`, `accountName` and optional `maskedAccountNumber`/`accountNumber`. Unknown shapes fail safely; only masked account numbers are displayed. Obtain the actual account-list endpoint/schema and link-success JSON from the backend developer, and update this single adapter if necessary.

The retrieval route returned 401 without a token. No separate linked-account GET route is listed in Swagger, and GET `/api/bank-accounts` returned 404. Ask the backend developer for a redacted authenticated `/api/accounts/me` response or its OpenAPI response schema, and confirmation that it returns persisted Mono-linked accounts. Stable account IDs and optional balance/currency fields are needed for the dashboard cards.

After backend linking succeeds, `app/linkbank.tsx` immediately fetches accounts. A failed refresh retries only retrieval, without reusing the Mono code. Returning to the dashboard triggers `useDashboardAccounts` through its focus effect and replaces carousel accounts with the fetched records. Pull-to-refresh uses the same route. This wiring is implemented, but displaying actual bank cards depends on the retrieval response matching the verified adapter contract. The UI and animations were not changed during deployment verification.

## Verification

`node src/banking/backend.test.cjs` covers the exchange body, bearer headers, token refresh, invalid account shapes, account masking, backend failures, pending responses and empty HTTP 204 responses with mocked requests. Full type-check reports unrelated `absoluteFillObject` errors in `appp/(tabs)/_layout.tsx` and `appp/settings-dashboard.tsx`.

Run on physical iOS/Android after backend deployment using sandbox credentials. Verify cancellation, OTP failure, offline widget loading, backend rejection, session expiration, success, duplicate callbacks and refresh failure after confirmation.

No native dependencies were added or updated in this integration. Matching Expo Go versions include WebView. Existing custom binaries must contain WebView; OTA cannot install native modules or change camera permissions. The camera usage description is already configured in app.json. For a custom development client, install `expo-dev-client` (currently absent) before creating an EAS development build if a fresh native binary is needed. The development profile already carries the sandbox public key.

SDK 2.2.0's callback declaration is outdated; the implementation extracts `getAuthCode()` from its real callback payload. Mono handles its own widget loading/error screen.

Sources: https://github.com/withmono/connect-react-native and https://docs.expo.dev/versions/v57.0.0/sdk/webview/. The repository-required https://docs.expo.dev/versions/v54.0.0/ was also reviewed.
