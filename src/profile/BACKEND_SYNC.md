# Profile and backend synchronization

## Current contract and session fix

The supplied frontend PDF now documents GET profile fields, including `paymentId`,
nullable `gender`, date-only `dateOfBirth`, and the six-field address object. These
are parsed from server data. Older schema requests below are historical.

All feature clients share `src/session.ts` for single-use refresh tokens. A
refresh 401 clears stored credentials and authentication; delayed/cancelled
requests cannot restore the expired session. Concurrent profile requests wait
for the same refresh. Temporary profile failures show inline Retry rather than
opening a sign-in popup every time the page receives focus.

Profile remains read-only for the existing text fields, with photo upload and
the structured address editor. Adult NIN remains mocked. Authenticated device
testing is still pending; repository and session tests use synthetic responses.

## Address update — 15 November 2026

Residential address is a real backend operation. Only the adult NIN section is
a placeholder: it collects nothing and performs no verification.

The address form sends `PATCH /api/users/me` with the Swagger-defined structured
`address`: `line1`, `line2`, `city`, `state`, `postalCode`, `country`. Street, city,
state and country remain required by the form; line 2 and postal code are optional.
The request sends no NIN or other unrelated profile fields.

The model retains structured address parts in memory and formats them for display.
Street text containing commas is not split into other fields. The GET adapter
accepts a structured address using those field names, a legacy display string,
or null. Legacy display strings are never guessed into editable fields. Address
text and structured parts are excluded from the on-device profile cache.

After PATCH, the app reloads `GET /api/users/me`. Success requires the returned
address to match the submitted fields (or the exact formatted legacy string).
Missing, different or failed read-back responses report an unconfirmed save;
there is no local-only success fallback. Null clears an old address. Draft edits
survive background profile refreshes and are cleared when the account changes.

Profile repository tests cover the wire payload, commas, optional/null fields,
cache exclusion, invalid inputs, failed/mismatched read-back and account isolation.
TypeScript also passes. A live authenticated PATCH/read-back still needs device
verification; Swagger does not publish a GET profile response schema.

## Earlier profile behavior (superseded for address)

The profile page's text fields are read-only. The profile photo remains changeable
through the existing library picker, crop and authenticated backend upload flow.
Nickname is removed from the UI and profile model; legacy cached
nickname values are ignored. Text edit modals and the password-edit form
are removed from this page. Other navigation (Back and Membership) remains.
TallyTag copy uses the actual clipboard API. Existing typography, cards, avatar
sizes, colors and row styles are retained; read-only rows have no chevrons.

The inactive appp snapshot still references old store property names. Its
compatibility alias returns an empty nickname and rejects nickname writes; no
nickname value/state is retained or restored for those references.

GET /api/users/me is refreshed on focus with the existing authenticated client,
refresh-token handling, account-scoped cache and retry/error behavior. Current
adapter fields are fullName, phoneNumber, email, tallyTag and avatarUrl. Gender,
DOB and address were previously device-only preferences: that local-save fallback
is now rejected, and legacy preference cache values are no longer displayed as
synced data. Account Plan no longer asserts the hardcoded Freemium value. Missing
server-provided values display Not provided, not editable Enter prompts.

## Backend work required for all-field sync

This workspace has no backend source. The inspected Swagger defines PATCH fields
fullName, phoneNumber, avatarUrl and defaultCurrency, but no GET profile response
schema for all displayed fields. No new backend contract has been invented.

The backend developer should confirm and document an authenticated, owner-scoped
GET /api/users/me response containing all authoritative profile values: full name,
canonical username/TallyTag, mobile number, email, avatar URL, gender, date of
birth, address and actual account/subscription plan. Confirm exact JSON field
names and types, optional/null behavior, date-only DOB format, plan entitlements
and the authoritative source for each field. Do not expose private credentials,
identity numbers or password data. The frontend decoder can then map those exact
fields; response-dependent fields remain pending that confirmation.

Persist these details server-side so a fresh installation or another device
receives the same values. Define the authorized correction/support flow for
read-only information. If fields must be immutable across all clients, enforce
that rule server-side too: removing this screen's editor is not authorization.
No new PATCH or local fallback is needed for this read-only screen. Existing
repository write methods used elsewhere remain restricted to their supported
backend operations and reject unsupported/mixed patches before any write.

Verification: profile repository tests cover account isolation, removal of legacy
nickname/local preference caches, rejected local-only and mixed-field writes,
existing backend operations, auth refresh and stale-response protection. Profile
UI has no text edit controls; photo writes retain the existing backend upload
and confirmation flow. Native
read-only interactions still need an on-device check.
