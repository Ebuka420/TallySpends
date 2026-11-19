# Payment QR and recipient lookup

The supplied frontend API contract uses `paymentId` in the form
`TSP-XXXX-XXXX`. The app reads it from `GET /api/users/me`; it never constructs
`user_<id>` payment identifiers. Regenerate old QR images made with that format.

Authenticated recipient lookup:

- `GET /api/payment-ids/{paymentId}`
- `GET /api/payment-ids/by-tag/{tallyTag}` (exact complete tag, optional @ removed)
- Both return `{ paymentId, displayName, tallyTag, isSelf }`.

The decoder requires an exact payment-ID match and `isSelf: false`. A tag lookup
also checks the returned tag. Ambiguous tags ask the user for a payment ID.
The recipient is shown for review before any payment can be submitted.

QR links remain `tallyspends://transfer?v=1&paymentId=TSP-XXXX-XXXX`, optionally
including decimal-naira `amount` and a note up to 40 characters. The parser
rejects foreign schemes/routes, duplicate/unknown fields and malformed values.
Opening/scanning a link only resolves the recipient; it never sends money.
Manual payment notes support the backend's 100-character limit.

Confirm now uses the sandbox wallet service in `src/wallet`, including local
transfer authorization, exact kobo conversion, a durable idempotency key and
server completion status. It does not write the local demo ledger or invent fees.
See [the handoff](../../BACKEND_HANDOFF.md) for recovery behavior and device checks.

`qrcode-generator` and SVG generate the actual QR; View Shot and Expo Sharing
share its PNG. `jsqr` independently decodes the output in `qr.test.cjs`.
The app's installed build handles its custom scheme; Expo Go's in-app scanner
works without OS registration of that scheme. HTTPS app links require separate
domain association and are not supported by this parser.

Run `node --test src/qr/qr.test.cjs src/wallet/wallet.test.cjs src/session.test.cjs`.
These tests use synthetic identities/responses, not captured live payments.
