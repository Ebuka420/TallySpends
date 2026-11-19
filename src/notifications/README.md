# Push notifications

The native token acquisition remains in `services/pushNotificationService.ts`.
`api.ts` sends the Swagger-defined authenticated request:

```text
POST /api/notifications/register-token
{ "expoPushToken": "ExponentPushToken[...]" }
```

The obsolete `/api/users/push-token` request and its undocumented platform/device
fields are removed. The API client uses the configured `API_URL`, refreshes tokens
once, rejects unsigned requests and redirects, and accepts only documented HTTP
200 acknowledgements. Push tokens and response bodies are not logged by the sync
code. Registration is not proof of delivery.

The root hook owns registration and notification-tap listeners. It retries on
login, account/token changes and foreground resume, and obtains a new Expo token
after native token rotation. Each attempt has a timeout, duplicate-call guard and
account-scope/cancellation checks. The notifications screen reads the cached token
for its diagnostic display without mounting a second registration/router hook.

`expo-notifications` is included in app.json plugins. A new native build is needed
to apply native configuration. Verify push delivery on Android and iOS with the
appropriate EAS/APNs/FCM configuration; none was provisioned by this change.

Swagger has no unregister endpoint. Backend token reassignment on account changes,
logout revocation and invalid-token cleanup still need a confirmed contract. The
client cancels in-flight registration on account changes; that cannot revoke a
token already stored by the server.

Run `node --test src/notifications/api.test.cjs`. Tests cover the wire contract,
auth refresh, invalid tokens, cancellation and non-success responses with mocked
HTTP. They do not claim a live registration or delivery test.
