# Children contract confirmed October 16, 2026

Source: backend developer's exact response examples and security explanation,
supplied by the user. Public Swagger could not be read through the web tool in
this turn. No live authenticated child request or real NIN was submitted.

POST /api/children accepts the five form values and consent with accepted true
and the version actually accepted. It returns a flat child record with numeric
id, firstName, lastName, dateOfBirth, guardianRelationship, ninMasked, ninVerified,
consent (accepted, noticeVersion, acceptedAt), and createdAt. New records return
201; the same guardian submitting the same child returns 200 with the existing
record. GET /api/children returns an array of these objects, including []. The
frontend normalizes safe positive integer IDs to strings for routes, and retains
only ID, names, DOB and relationship. Masked/full NIN and verification metadata
are neither displayed nor persisted. No synthetic guardian object is expected.

Both operations require Bearer authentication and are scoped to the current
user by the backend. Overview reads find the selected ID in this user's GET
collection. No by-ID or edit endpoint exists: the legacy PATCH path is blocked,
the overview no longer offers Edit, and the direct edit route cannot save.

Client consent validation now respects the confirmed 20-character version limit.
No idempotency-header behavior is assumed; the backend deduplicates children per
guardian. Generic 409 messages do not reveal another guardian's record. Validation
errors remain fixed safe messages instead of echoing raw server messages. The
existing explicit guardian acceptance, loading/navigation, post-create collection
refresh and duplicate-submission guard remain. Entered NIN is masked in the form
and cleared after every submission attempt, including failures, as well as blur
and background. It is never added to storage, logs or navigation parameters.

## Security confirmed by backend developer, not independently audited

- AES-256-GCM before storage, separate keyed duplicate-detection hash, and a
  plaintext last-four suffix used for masked responses.
- No full NIN response, request-body/NIN application logging or plaintext NIN
  database query; hosting-platform logging has not been audited.
- Authentication-scoped queries and generic cross-guardian duplicate conflicts.
- ninVerified is false: no external NIN verification is performed.
- Relationship is self-declared; neither adult status nor actual guardian
  authority is verified. These operations create profiles, not wallets or logins.

These details satisfy the earlier request for backend-owner confirmation, so
ninSecurityConfirmed is true in readiness.ts. They do not establish independent
verification of encryption keys, platform logs, retention or legal authority.

## Remaining release requirement

approvedNotice remains null, so production submission stays disabled. Supply the
approved full child-data notice, guardian declaration, authoritative current
version and update process. v1.2.0 was explicitly an example, not an approved
version to hardcode. The backend accepts any nonblank version up to 20 characters
and stores it with server time; it does not reject stale versions. Once the team
approves a current version, provide it to the backend developer for server-side
stale-version enforcement and bind that same version to the displayed text.
Do not publish placeholder legal wording or bypass explicit consent.

Verification: mocked tests pass for the exact supplied shape with synthetic
values, numeric ID normalization, empty/malformed lists, NIN-field stripping,
201/200 replay, consent rejection/version length, no unsupported PATCH, safe
errors and auth refresh. Existing list/overview can consume the real confirmed
contract; end-to-end registration remains untested and gated on the notice.
