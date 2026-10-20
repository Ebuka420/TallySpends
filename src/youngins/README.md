# Youngins: frontend and required backend contract

**Current status (October 16):** [CONFIRMED_CONTRACT.md](./CONFIRMED_CONTRACT.md)
supersedes the historical proposals below. POST returns a flat child object with
a numeric ID (201 new / 200 replay); GET returns an array. The adapter now matches
these supplied schemas, and unsupported edit requests are blocked. NIN controls
are backend-developer-confirmed. The approved full notice and its current version
remain missing, so registration is still disabled; the example version is not used.

## Production integration update (October 14, 2026)

Read production `/swagger/v1/swagger.json` during this change. It now lists
`POST /api/children` and `GET /api/children`. `RegisterChildRequest` contains
firstName, lastName, dateOfBirth (date), guardianRelationship, nin, and
`ChildConsentRequest` with accepted (boolean) and noticeVersion (string).
Both operations document HTTP 200 without a response schema. No privacy-notice,
individual-child read, or child update route is documented.

Creation and list reads now use the existing authenticated Youngins client with
these production collection routes. Overview reads select the profile from
GET /api/children. Creation receives explicit consent from the existing guardian
acceptance step and rejects absent or stale acceptance. After a confirmed receipt,
the screen clears the draft, refreshes GET /api/children, then navigates to the
overview. A failed refresh offers only a refresh retry, preventing a second POST.

**Production submission is disabled:** `readiness.ts` deliberately contains no
approved notice and no NIN security confirmation. The notice loader returns a
clear unavailable error without calling an invented privacy endpoint. The same
gate runs in `younginsApi.create` before building or sending a request, even if
the UI consent step is bypassed. There is no environment flag to activate it.
The existing explicit acceptance action and NIN masking/clearing remain intact.

**Outstanding backend verification:** obtain redacted successful POST/GET bodies
and their response schemas; approved privacy text/declaration, immutable current
version and authoritative source; evidence of NIN encryption and key management,
request/error/log redaction, ownership-scoped authorization, consent persistence,
and retention/deletion controls. Confirm supported statuses and idempotency
behavior as well. Review and implement the confirmed contract before updating
the release prerequisites. This workspace has no backend implementation, so
these security guarantees cannot be confirmed here.

The response parsers retain only the existing UI's whitelisted legacy fields;
that envelope remains unverified, not a claimed production schema. Unknown,
incomplete, or mismatched responses fail safely with a response-contract error;
no fallback data, owner IDs, or NIN are displayed. A matching legacy envelope
does not establish server-side ownership enforcement. No new response structures
have been added. The legacy edit route remains unchanged because no replacement
PATCH endpoint is confirmed; it must be resolved separately with the backend.
No authenticated production requests or child data were submitted in this change.

Verification: `node src/youngins/youngins.test.cjs` passed with synthetic fixtures,
including rejected/stale consent, production collection paths, auth refresh,
response NIN stripping and safe errors. `tsc --noEmit` reported only pre-existing
`StyleSheet.absoluteFillObject` errors in `appp/(tabs)/_layout.tsx:209` and
`appp/settings-dashboard.tsx:221`; no Youngins errors were reported.

The historical proposal below is retained for the backend discussion; its
`/api/youngins` collection paths are superseded by `/api/children`.

Status (October 10, 2026): this workspace contains the Expo frontend only. The deployed Railway Swagger `/swagger/v1/swagger.json` has no Youngins route or model. The routes below are **proposed, not verified deployed**. Database encryption, guardian authorization, consent storage, and backend integration tests cannot be implemented or verified without the backend repository. No successful response is fabricated.

## Frontend behavior

More → Youngins → Open Youngins Account → approved notice → Agree and continue → five-field registration → backend confirmation → profile overview. Guardians can edit the four non-NIN profile fields. The list and overview refetch on focus. Names and DOB never go into route parameters; only the opaque profile ID does.

The form contains only first name, last name, DOB, guardian relationship, and NIN. Consent is a separate step, not another registration field. Names must be nonblank; DOB must be a real date, not in the future, with age below 18 on the submission date; relationship is Mother, Father, or Legal Guardian; NIN is exactly eleven digits, including any leading zero. DOB is local-calendar `YYYY-MM-DD`, not a UTC timestamp. For February 29 birthdays in non-leap years, this client considers the birthday reached on March 1; align the backend policy or explicitly agree an alternative.

NIN is masked in the input, held only in component/request memory, never logged or locally persisted, and cleared on success, route blur, or app background. Backgrounding also cancels requests and clears consent. An aborted request can still complete at the server; reconcile via the list before starting a new registration. Native/app inspection tools must not record request bodies or child data. JavaScript memory clearing is best effort, not guaranteed secure erasure.

Current behavior: missing approved privacy information or NIN security confirmation produces an unavailable message before any child-data form appears, without requesting an undocumented notice endpoint. Do not bypass this gate with dummy notice text or success. The backend owner must confirm secure storage and authorized guardian workflows before registration is enabled.

## API contract for the backend developer

Base URL: use the existing Railway API. All endpoints require the existing validated `Authorization: Bearer <access_token>`. Responses must use `Cache-Control: no-store`. Frontend refreshes a rejected session once through the existing `/api/auth/refresh` flow. Accept JSON. Use server timestamps.

### GET /api/youngins/privacy

Return 200 only when NIN collection is approved and available:

```json
{
  "version": "youngins-privacy-v1",
  "notice": "<approved full child-data privacy notice>",
  "guardianDeclaration": "<approved parental/legal-guardian declaration and consent wording>",
  "ninCollectionEnabled": true
}
```

The approved notice must explain controller/contact, purpose and necessity of NIN collection, access, storage/security, retention/deletion, child/guardian rights, withdrawal and its consequences, and any approved sharing. The wording above is a contract placeholder, not approved legal text. `version` must identify immutable approved content. Return 503 or `ninCollectionEnabled: false` until ready. Verify the signed-in account's guardian eligibility under the approved policy; a relationship dropdown alone does not establish legal authority.

### POST /api/youngins

Headers: existing Bearer auth, `Content-Type: application/json`, `Idempotency-Key: <opaque unique key>`.

Exactly five registration values plus consent metadata:

```json
{
  "firstName": "<first name>",
  "lastName": "<last name>",
  "dateOfBirth": "YYYY-MM-DD",
  "guardianRelationship": "Mother",
  "nin": "<exactly 11 digits>",
  "consent": { "accepted": true, "noticeVersion": "youngins-privacy-v1" }
}
```

Never accept a guardian ID, BVN, phone/email, credentials, or financial-account provisioning flag from this request. Derive `guardian_id` from validated authentication claims. Revalidate all five values and guardian eligibility. Check the active approved notice, accepted consent, and NIN-collection readiness server-side. Reject missing/stale/withdrawn consent even if the frontend is bypassed.

Commit the profile, encrypted NIN, immutable consent record, and idempotency result atomically. Return **201 only after durable storage**, or 200 for a confirmed idempotent replay:

```json
{
  "guardian": { "id": "<authenticated guardian ID>", "displayName": "<guardian display name>" },
  "profile": {
    "id": "<opaque profile ID>",
    "firstName": "<first name>",
    "lastName": "<last name>",
    "dateOfBirth": "YYYY-MM-DD",
    "guardianRelationship": "Mother",
    "guardian": { "id": "<same authenticated guardian ID>", "displayName": "<guardian display name>" }
  }
}
```

No NIN (full or partial), wallet, balance, bank account number, or dummy transactions in responses. Do not return 202/204 as a created profile. The client requires a valid profile receipt before showing success.

### GET /api/youngins

Return 200 `{ "guardian": { "id": "...", "displayName": "..." }, "profiles": [<safe profile objects above>] }`. Query only profiles owned by the authenticated guardian; an empty result is `profiles: []`. Derive the top-level guardian from authentication, not a requested owner. This frontend displays the complete returned list, so do not silently paginate it; add an agreed pagination contract if needed.

### GET /api/youngins/{id}

Return 200 with the same safe `{guardian, profile}` receipt as creation. Query by both profile ID and authenticated guardian ID. Return 404 for nonexistent or another guardian's profile to avoid exposing existence. Do not serialize encrypted NIN into any API DTO.

### PATCH /api/youngins/{id}

Same authentication, ownership query and idempotency header. Request contains **only** `{firstName, lastName, dateOfBirth, guardianRelationship}`. Return 200 with the safe receipt after commit. Reject attempts to change guardian ownership, NIN, or provision financial accounts. Require backend-approved guardian authority for changes in relationship and DOB; store an audit event without sensitive values. Agree an age-out policy: a profile turning 18 remains readable to its authorized guardian subject to consent/policy, and eligibility/transition must be enforced server-side.

### Errors

Use 400/422 for invalid input, 401 expired/missing auth, 403 guardian ineligible, 404 missing/unowned profile, 409 duplicate/idempotency conflict or changed notice, 429 throttling, 503 not configured. A safe error DTO may be `{ "code": "INVALID_INPUT", "fieldErrors": { "nin": "NIN must contain exactly 11 digits." } }`. Never echo supplied NIN or other request values. The frontend intentionally uses fixed safe error messages rather than displaying raw error bodies.

## Database and security implementation requirements

- Add `youngins_profiles`: opaque ID, guardian user foreign key, first/last name, date-only DOB, validated relationship enum, created/updated server timestamps, lifecycle state. Index guardian ID for ownership-scoped queries. Do not create a child user/login or banking wallet as a side effect.
- Store NIN as authenticated encrypted ciphertext with nonce/tag and encryption-key version, using backend/KMS-managed keys, key rotation, and restricted decryption permissions. No plaintext NIN columns, general-purpose logs, traces, analytics, email, caches, or backups without equivalent protection. Keep secrets out of the Expo application.
- If duplicate detection requires a lookup, use a separately keyed HMAC of normalized NIN; never a plain hash of an eleven-digit identifier. Approve cross-guardian duplicate/authority rules without revealing another child's or guardian's existence.
- Add immutable consent records: guardian ID, child profile ID, approved notice version/content reference, accepted server timestamp, applicable authority verification reference, withdrawal/lifecycle status. Record consent before committing NIN/profile; document approved retention and deletion handling, including backups.
- Scope idempotency records to authenticated guardian, operation and key; same key/body returns the saved receipt, changed body returns 409. Do not persist a plaintext copy of the sensitive request; use a keyed digest and safe response. Handle concurrent identical submissions with a transaction/unique constraint. Enforce an agreed duplicate-profile rule across new keys because a device restart loses the in-memory key.
- Restrict every read/update/delete to the authenticated owner with server authorization. Never rely on the frontend route guard or echoed guardian IDs. Apply rate limits and least-privilege database/service access. Review access to child data independently of ordinary app profile updates.
- No external NIN verification requests until an approved integration and appropriate authorization exist. Registration should remain unavailable if backend requirements or approved consent are missing.
- No wallet, bank account, account number, or funds provisioning. A licensed partner's financial capability would require a separate future scope and approvals.

## Verification and deployment

Run `node src/youngins/youngins.test.cjs` for validation and mocked API behavior. These tests are not evidence of deployed storage, backend ownership enforcement, or legal approval.

Implementation checks passed: the mocked test suite and an Expo export containing both iOS and Android bundles (`.expo/youngins-check`). Whole-project TypeScript still reports only the two pre-existing `StyleSheet.absoluteFillObject` errors in the inactive `appp` directory. Physical-device interactions and backend authorization remain unverified.

Backend acceptance tests must cover missing/expired auth, eligible guardian A creation, guardian B list filtering and ID-based read/update rejection, spoofed guardian fields, invalid names/DOB/age/NIN, missing/stale consent, collection-disabled state, encrypted storage, no sensitive response/logging, concurrent duplicates/idempotent retry, storage failure rollback, and no financial/child-login side effects. Do not test by transmitting a real child's NIN to an unapproved service.

The existing project uses Expo 57.0.24 and datetimepicker 9.1.0, matching the local Expo bundled-module manifest. No package/native configuration changes were added. The picker is already used by this app. Use the matching installed Expo Go runtime on iOS/Android. After backend deployment, test date selection/dismissal, relationship dropdown, validation, loading/disabled controls, consent cancel, background NIN clearing, failure/retry, success navigation and refreshed list on physical devices. Native bundles can verify compilation, but not these device behaviors or backend authorization.
