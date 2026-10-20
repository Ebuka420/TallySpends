# Personal QR payment requests

**October 14 update:** see [REQUEST_FIX.md](./REQUEST_FIX.md) for the root cause,
local authenticated-user-ID generation, draft amount/note handling, retry and
PNG sharing fixes, and missing backend requirements. The historical proposal
below is superseded where it requires a new publicPaymentId before local QR
generation. The scanner now also accepts `user_<numeric authenticated userId>`
within the existing v1 request format. No payment integration is activated.

Frontend prepared on October 11, 2026. The old decorative QR matrix is replaced by a real standards-based encoder. Backend-issued public identity and recipient lookup are required before a user's QR can be displayed or a scanned recipient selected. No backend contract has been supplied yet: the fields and lookup route below are proposed and isolated in `api.ts`, not claimed deployed.

## Frontend behavior

- Dashboard QR button opens the existing Tally Request page. The design remains: QR card, username badge, amount/note configuration, Share QR Image button. Colors follow the existing theme; the QR itself stays dark on white with four modules of quiet space on all sides.
- Read the signed-in identity through the existing profile endpoint. Never generate IDs from usernames, full names, local demo IDs, or a random device identifier. Missing/malformed backend IDs show unavailable/retry instead of another user's or a dummy QR. The identity is refetched on focus and held only in memory.
- `qrcode-generator` creates an automatically sized QR matrix with error correction M. The existing `react-native-svg` renders it. Requests are ASCII URI strings; Unicode notes are percent encoded, so they round-trip through the encoder.
- Share QR Image captures the actual rendered QR as PNG using the installed `react-native-view-shot`, opens the installed `expo-sharing` sheet, and releases the temporary capture after sharing. A synchronous lock prevents duplicate share dialogs. No gallery permission, new native module, or text-only fake image share was added. Web file sharing reports unavailable rather than pretending to share an image.
- Scanner accepts only versioned TallySpends request links. It rejects arbitrary hosts/schemes, old username-only codes, duplicate or unknown parameters, invalid IDs, invalid amounts, overly long/control-character notes, and unsupported versions. It does not open arbitrary scanned links or echo raw scan contents into alerts.
- Resolve the public ID through the authenticated backend. The returned ID must match the scanned ID. Only the backend's safe display name and TallyTag appear in the existing review flow. No QR lookup uses `MOCK_RECIPIENTS`; the old scan simulator was removed. The unrelated manual/demo recipient list remains as before.
- Scanning or opening a link never sends money. The existing review flow can collect amount/note and show the verified recipient. QR-sourced recipients are explicitly blocked from the old local demo transfer path: confirmation reports that real payments are not connected, and no transaction or payment success is recorded. Unknown backend fees and live balances are not inferred from the local demo wallet.
- Incoming native links are normalized through `app/+native-intent.tsx`. A validated request survives the sign-in flow in memory for up to ten minutes, then expires. It is never automatically paid or persisted to disk. Router parameters are consumed/cleared to permit later opening of the same link. Other routes/authentication logic remain unchanged.

## QR payload

```text
tallyspends://transfer?v=1&paymentId=<public-payment-id>&amount=1200.50&memo=Lunch%20%26%20tea
```

`paymentId` must be a permanent backend-generated public ID, unique to the user and stable across devices. This adapter accepts 16–128 ASCII letters/digits/underscore/hyphen, including UUIDs. `amount` and `memo` are optional. Amount is a positive decimal string in NGN major units with at most ten integer digits and two fractional digits. Notes are at most 40 UTF-16 code units (matching the current UI), without control characters. These values are untrusted request suggestions, not signed payment instructions. Amount, currency, recipient eligibility, fees and authorization must be validated again by any future payment backend.

The personal code with no amount/note remains stable while the backend ID remains stable. Adding amount/note creates a request-specific code for the same user. No token, private user/account ID, NIN/BVN, account number, or secret belongs in the QR.

## Proposed backend adapter contract

All calls reuse the existing `API_URL`, HTTPS and Bearer session. A 401 refreshes once through `/api/auth/refresh`, saving rotated tokens through the existing store login function. GET requests time out after 15 seconds and are cancelled when screens leave focus. Raw backend error bodies are not displayed.

### Existing GET /api/users/me: add a public payment ID

Return a plain JSON object including:

```json
{
  "publicPaymentId": "<permanent unique public ID>",
  "fullName": "<current user's display name>",
  "tallyTag": "<current user's TallyTag>"
}
```

Other existing profile fields can stay. The QR adapter copies only these three fields. TallyTags may have an optional leading `@`; this adapter accepts letters/digits/underscore/dot/hyphen, max 64 characters. Confirm the real schema before deployment, especially if the API wraps this object or uses different names. Never substitute fullName or TallyTag for the public ID. Add a database uniqueness constraint, backfill existing users, and create IDs during new-user registration.

### Proposed GET /api/payments/recipients/{publicPaymentId}

Authenticate the sender. Return HTTP 200 with only the same safe shape:

```json
{
  "publicPaymentId": "<exact requested ID>",
  "fullName": "<resolved recipient display name>",
  "tallyTag": "<resolved recipient TallyTag>"
}
```

Do not expose private bank/identity/contact details. Return 404 for unknown or unavailable IDs, 401 for invalid sessions, 403 for prohibited lookup, and 429 for rate limiting. Apply the agreed privacy/eligibility and enumeration protection policy. Do not treat this lookup as payment consent or a debit authorization. Confirm the route and real successful JSON with the frontend developer; only `api.ts` needs changing if different.

No real payment POST is invented or enabled. Supply the actual payment endpoint, server validation, verified recipient ID contract, monetary units/currency, fee/quote handling, sender authorization, idempotency, status reconciliation, and failure response formats before enabling money movement. A GET lookup alone is insufficient.

## Expo/runtime and links

The project is on Expo 57; SVG, Camera, Sharing and View Shot were already installed. Only JavaScript `qrcode-generator` and test-only `jsqr` were added; no native configuration/version changes are required for this implementation. Use the matching Expo Go runtime on Android/iOS for in-app scanning and sharing.

Expo Go does not register the application's `tallyspends` scheme with the operating system. In-app scanning works independently of this limitation. Test external links in an installed app/development build, or use the project's current `exp://<development-host>/--/transfer?...` URL while using Expo Go. Never put a PC/Metro IP into personal QR codes. Native intent normalization also supports Expo transport paths.

Browser-friendly HTTPS payment links still require an owned domain and verified iOS Universal Links/Android App Links, plus a fallback web page. No placeholder domain was invented. Custom-scheme QR links are currently accepted only by the in-app scanner and the installed app's native scheme; support for an owned HTTPS domain must be explicitly added to the parser and app associations later.

## Checks

Run `node src/qr/qr.test.cjs`. Tests use synthetic IDs and mocked API replies, with an independent QR decoder verifying the actual matrix, including long IDs and Unicode notes. They cover payload validation, invalid/foreign links, stable identity/no username fallback, safe response filtering, mismatched recipient IDs, native intent normalization/replay state, Bearer lookup, token refresh and backend failures. They are not evidence of deployed recipient lookup or real payments.

The test suite passed, and Expo successfully exported both iOS and Android bundles to `.expo/qr-check`. Whole-project TypeScript reports only the two existing `StyleSheet.absoluteFillObject` errors in the inactive `appp` copy. Native share-sheet/device linking interactions and live backend lookup remain unverified.

Physical iOS/Android checks remain: fetch two real backend-issued IDs, scan each other's displayed/shared PNG, verify names and note/amount, duplicate scans, camera denial, offline/error/retry, share-sheet cancellation, cold/warm link opening and sign-in continuation. Confirm that no QR-confirmation path touches the demo wallet. External scheme behavior needs an installed app build; browser HTTPS links need domain setup.

Sources: https://github.com/kazuhikoarase/qrcode-generator, https://docs.expo.dev/versions/v54.0.0/sdk/sharing/, https://docs.expo.dev/versions/v54.0.0/sdk/captureRef/, https://docs.expo.dev/router/advanced/native-intent/.
