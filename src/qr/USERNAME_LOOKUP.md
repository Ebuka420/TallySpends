# Add Recipient investigation — October 14, 2026

The screen is `app/transfer.tsx`. The Add Recipient modal previously stripped an
@, searched `MOCK_RECIPIENTS` in `src/store.ts` with an exact username comparison,
and opened the transfer modal on a match. It did not add a saved backend record.
The main search input filtered the same mocks by name/username; Recents and My
Accounts also used mock data, including guessed ownership from bank labels and
a hardcoded username. No authenticated username lookup request was sent. A
failed local match incorrectly claimed the user did not exist in the system.

Production Swagger was read during this investigation. It documents only
GET/PATCH /api/users/me and POST /api/users/me/avatar under user operations; no
username lookup, recipient search or saved-recipient operation is listed. This
does not prove an undocumented route cannot exist, but there is no confirmed
contract to integrate. No endpoint was guessed or called with personal data.

The full production route list also exposes GET /api/payment-ids/{paymentId}.
It documents only a string paymentId path parameter and HTTP 200 without a
response schema. It does not document username input or search semantics; do
not assume a username is a paymentId or route usernames through it. Its response
contract may be useful to unify verified recipient identities once confirmed.

The screen now shows no mock recipients. Add Recipient validates the entered
username and checks the signed-in user's own known TallyTag, then explains that
verification is unavailable. It keeps the modal/input for retry and never adds
a recipient or simulates lookup success. Styling remains unchanged. The existing
QR flow still uses its separate proposed recipient resolver and still blocks
real payments; this investigation does not enable money movement.

## Required backend functionality (proposal, not deployed contract)

Confirm an authenticated exact-username lookup, for example:

```text
GET /api/users/by-username/{username}
Authorization: Bearer <access token>
```

Suggested minimal successful response:

```json
{
  "publicPaymentId": "<stable recipient identifier>",
  "fullName": "<verified display name>",
  "tallyTag": "<canonical registered username>"
}
```

Agree case normalization and permitted username characters. Query actual
registered, eligible users, enforce sender authentication, reject self-add using
the authoritative user ID, and apply rate limits/recipient visibility policy.
Return 404 for nonexistent/unavailable users, 401 for expired sessions, 403 for
ineligible access, 429 for throttling, and a safe structured error code for
self-add. Return no email, phone, tokens, NIN, bank credentials, or account data.
The frontend must reject unknown/incomplete responses and verify the returned
canonical username matches the lookup, then show the real name and @username
for explicit confirmation. Network failure must offer retry without adding.

If "add" means saving a contact across sessions/devices, additionally confirm
authenticated create/list/remove saved-recipient endpoints. Derive the owner
from auth; validate target eligibility and self-add again server-side; enforce
uniqueness and return only safe identity fields. Lookup alone is not saving a
recipient, and neither operation is permission to make a payment. The frontend
list must be populated from these verified records, not demo fixtures.

Backend response examples and documented routes are needed before implementing
the real confirmation/save and network-error flows. No fake working API is
introduced while that contract is unavailable.

Validation: TypeScript reports only the existing absoluteFillObject errors in
appp/(tabs)/_layout.tsx and appp/settings-dashboard.tsx. Source inspection confirms
this screen no longer imports or matches MOCK_RECIPIENTS. No real username
requests or payment requests were sent, and no UI/device check was performed.
