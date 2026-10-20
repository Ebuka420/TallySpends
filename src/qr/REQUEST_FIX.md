# Tally Request QR investigation — October 14, 2026

The error originated in `parseIdentity`: it required a valid publicPaymentId,
fullName and tallyTag from GET /api/users/me. The publicPaymentId requirement
was a proposed backend addition, not the stable userId already supplied at login.
Production Swagger inspected during this fix lists /api/users/me without a
response schema and does not list /api/payments/recipients/{paymentId}.

QR generation now uses the authenticated profile owner scope derived from the
stored login userId. Numeric IDs are represented as `user_<id>`; valid opaque
IDs retain their value. No email-derived scope, username, random/device ID,
token claims, NIN or bank details are used. Display name/tag are not encoded.
No QR generation endpoint is needed: qrcode-generator produces a real matrix,
and react-native-svg renders it locally. When the stored userId is unavailable,
the profile GET may supply a publicPaymentId; missing identity information
produces an actionable error. Retry refreshes profile state and retries the
identity adapter. Account changes invalidate the previous QR.

The existing versioned format is preserved:

```text
tallyspends://transfer?v=1&paymentId=user_123&amount=1200.50&memo=Food%20%26%20tea
```

The shared scanner validator accepts this numeric namespace and existing opaque
IDs. The ID is an identifier, not proof of authorization. Local recognition
does not mean the backend can resolve it or process a payment.

Amount and category/note edits remain drafts until Apply Request Details.
Closing the modal leaves the actual QR unchanged; reopening restores applied
details. Amount validation and the 40-character note limit are enforced. Add
Category must first be saved as a real category. Clearing applied details restores
the same user's personal QR. Share QR Image captures the actual QR view at 840px
as a PNG with its white quiet zone, invokes native expo-sharing, and releases the
temporary file. It does not share a URL/text in place of an image.

## Backend requirements

- Confirm the authoritative /api/users/me response and stable login userId for
  users whose stored session lacks an identifier.
- Confirm an authenticated recipient resolver and its accepted ID namespace.
  The existing frontend adapter proposes GET /api/payments/recipients/{paymentId}
  returning `{publicPaymentId: <exact requested ID>, fullName: <verified display
  name>, tallyTag: <verified tag>}`. It must map `user_<id>` to the corresponding
  user or agree a replacement public ID contract. This response is required by
  the current adapter, not a verified production schema.
- Enforce recipient visibility/eligibility, safe errors, and throttling without
  exposing credentials or private account details.
- Supply a separate real payment contract: authorization, validated amounts,
  fees, idempotency, status reconciliation and failure handling. The existing
  QR-recipient payment block stays enabled; no fake payment success is added.

## Verification

`node src/qr/qr.test.cjs` passes: independent QR decoding, numeric and opaque
authenticated identities, identity stability across profile edits, amount/note
round trips, foreign/forbidden fields, recipient validation and auth refresh.
Native PNG/share-sheet and modal interactions need an on-device check. No real
recipient lookup or payment was performed. TypeScript reports only the existing
two errors in the inactive appp directory.
