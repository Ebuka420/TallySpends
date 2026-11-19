# Rate Us feedback

Updated against production Swagger on 15 November 2026:
https://tallyspendapi-production.up.railway.app/swagger/v1/swagger.json.

The authenticated client sends `POST /api/feedback` with an `Idempotency-Key` and
exactly the published `SubmitFeedbackRequest` fields:

```json
{
  "rating": 4,
  "categories": ["Budgeting Tools", "App Performance"],
  "suggestions": "Keep this spacing.\nAnd this newline."
}
```

The form requires a 1–5 star rating because the published rating is a non-nullable
integer and the API does not define a value for an omitted rating. Suggestions
and category selections remain optional. Suggestions retain their original text.

Submission is enabled by default. `EXPO_PUBLIC_FEEDBACK_ENABLED=false` explicitly
disables it. The client requires a signed-in session, refreshes rejected tokens
once, uses HTTPS without redirects, preserves the same request body/key on retry,
and blocks duplicate taps. Inputs remain intact on errors and requests are aborted
when the screen closes.

The published success is HTTP 200 without a response schema. The app acknowledges
submission on that status, including an empty response, without inventing a saved
record ID or email status. Explicit negative/pending JSON responses and other
status codes do not show success. The UI says “submitted”; database persistence
and email delivery require separate backend confirmation.

Run `node --test src/feedback/service.test.cjs`. Tests use mocked HTTP and cover
the exact wire payload, validation, auth refresh, duplicate taps, unchanged-draft
retries, empty 200 acknowledgements, explicit failures and non-200 responses.
Authenticated device submission remains to be verified.
