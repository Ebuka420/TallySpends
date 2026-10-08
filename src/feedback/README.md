# Rate Us feedback

## Current status

The Rate Us page preserves its existing layout and StyleSheet. Selected stars
use the requested #20142A. Users can select 1–5 stars and multiple existing
categories, or submit meaningful written feedback without a rating. Whitespace
is used only for validation; suggestions are sent exactly as entered.

The simulated success timer has been removed. The page freezes inputs during a
request, shows the existing spinner, blocks repeated submissions and retains all
entries on error. Success requires a backend receipt confirming database storage
and a durably queued or sent notification. An unchanged draft reuses its request
key and timestamp on retry during the current page session. Success blocks further
submissions until the page closes. Unmount aborts outstanding requests.

On October 9, 2026, the configured Railway API's public Swagger specification
contained no feedback endpoint; a read-only GET to `/api/feedback` returned 404.
There is no backend application or database code
in this workspace. **The service below is a proposed contract, not a deployed API.
Email delivery and database storage are not implemented in this Expo repository.**
`EXPO_PUBLIC_FEEDBACK_ENABLED` defaults to disabled, so there is no fake success or
request to a presumed endpoint. Submission currently reports that delivery is
unavailable and leaves the user's input intact.

## Required backend contract

Implement `POST /api/feedback` on the backend used by `src/api.ts`:

```http
Content-Type: application/json
Idempotency-Key: <opaque request identifier>
Authorization: Bearer <access token, when available>
```

```json
{
  "rating": 4,
  "tags": ["Budgeting Tools", "App Performance"],
  "suggestions": "  Keep this spacing.\nAnd this newline.  ",
  "submittedAt": "2026-10-09T10:00:00.000Z"
}
```

`rating` is null for text-only feedback. Require null or an integer 1–5 and at
least a rating or non-whitespace suggestions. Validate tags against the six
existing categories in `service.ts`, reject duplicates or normalize categories,
and apply documented input length/request limits without silently truncating
suggestions. Preserve original text in storage and email. Validate client time,
but also assign an authoritative server UTC `createdAt` timestamp.

For signed-in users, identify the user from a validated JWT and load available
name/email from the database. Never trust a client-provided user ID. Anonymous
feedback can use null identification; an invalid supplied token must return 401.
The frontend uses existing `/api/auth/refresh` and store `login` to rotate tokens.
If anonymous feedback is not supported, return 401 rather than accepting it as
an identified user.

After committing feedback and its email job, return HTTP 201 (or 200 when
replaying a stored idempotent receipt):

```json
{
  "id": "feedback-record-id",
  "saved": true,
  "emailStatus": "queued"
}
```

`emailStatus` may be `sent` only when the provider has accepted the email. Queued
means a persistent job exists, not a fire-and-forget in-memory task. Provider
acceptance is not proof of inbox delivery. The frontend does not claim the email
has arrived. Unknown/malformed receipts never produce a success alert.

Use 400/422 for invalid input, 401 for invalid authentication, 429 with Retry-After
for rate limits and 503 for temporary inability to commit. For web requests,
allow Content-Type, Authorization and Idempotency-Key in CORS preflight.

## Database and secure email requirements

The backend must implement these together, using its existing database and
framework. They cannot be implemented safely inside the Expo app:

1. In one database transaction, insert the feedback record and a pending email
   outbox job. Store rating, categories, exact suggestions, client submittedAt,
   server createdAt and nullable authenticated user ID. Store notification status
   separately so provider failure never deletes or loses the feedback.
2. Enforce a unique idempotency key scoped to the authenticated user (or anonymous
   submission). Store a payload hash and receipt; identical retries replay the
   same receipt, while reuse with a different payload returns 409. Retain these
   records through the retry window. Never create another outbox job on replay.
3. A server-side worker claims persistent jobs atomically with a lease to prevent
   concurrent workers from sending the same job. Send to the server-configured
   fixed recipient `tallyspends@gmail.com`. The client cannot supply recipients.
4. Use Resend or SMTP with credentials stored only in backend deployment secrets.
   Configure a verified sender address/domain. Include rating or “Not provided”,
   all categories, exact written feedback, both timestamps and available user
   identification in a plain-text body. If also rendering HTML, escape user text.
   Use a fixed subject; never interpolate feedback into email headers.
5. Configure provider timeouts. Reuse a stable provider idempotency identifier
   based on the feedback ID where supported. SMTP does not guarantee exactly-once
   delivery; persist a stable Message-ID and handle ambiguous send results rather
   than blindly resending. Do not put API keys/passwords in logs.
6. Retry transient timeouts, rate limits and provider 5xx failures with exponential
   backoff plus jitter, honoring Retry-After. Example intervals: 1 minute,
   5 minutes, 30 minutes, 2 hours and 12 hours. Persist attempt count, next attempt,
   last safe error and provider message ID. Expired leases must be recoverable.
7. Do not endlessly retry invalid recipients, invalid sender configuration or
   authentication failures. Mark jobs for operator review, alert operations and
   permit manual requeue after correcting configuration. Keep feedback records
   even after retries are exhausted. Handle signed provider bounce/delivery
   webhooks if available to track actual delivery separately from API acceptance.

Set backend-only recipient/sender/provider secrets (for example
`FEEDBACK_EMAIL_TO`, `FEEDBACK_EMAIL_FROM`, `RESEND_API_KEY`, or SMTP settings),
apply schema migrations, deploy the API and worker, and verify the database and
email provider with a sandbox/test submission. No such credentials or account
access are available in this workspace.

Only after the backend contract, persistence and email worker are verified, set:

```env
EXPO_PUBLIC_FEEDBACK_ENABLED=true
```

Then fully reload Expo. This flag is public configuration, not a credential.
If the actual backend contract differs, update `service.ts` before enabling it.

## Verification

`node src/feedback/service.test.cjs` uses mocked HTTP to exercise ratings 1–5,
text-only eligibility, multiple category toggles, exact text preservation,
loading transitions, duplicate protection, success, failure, retry identity,
receipt validation and token refresh. It cannot verify a missing backend's
database or email delivery.

Physical-device checks after deployment: tap every star; select/deselect multiple
categories; enter whitespace-only text versus multiline suggestions; submit and
tap again while loading; verify success only after a receipt; interrupt the
network and retry; verify one stored record and one email job; expire the token;
force provider failure and confirm feedback stays saved while the worker retries.
The other settings-feedback page and unrelated features are unchanged.
