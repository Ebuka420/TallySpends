# Settings implementation status

The separate Settings feedback route has been removed. Rate Us is retained.

Dashboard section visibility, automatic ordering by active plan count, and private balance previews use `settings.ts`. Settings are persisted on this device only. Writes are serialized; failed writes do not publish a successful update. Dashboard settings and Private mode apply after Save Changes. Private mode hides the dashboard account balances, including during settings hydration.

Tab-bar opacity now broadcasts changes to all mounted store consumers. Themes already persist and broadcast; their screens now report storage errors. Settings and About use the configured Expo app version. Logout awaits removal of the stored session and reports failure.

Still required before the remaining settings can be called functional:

- Decide whether automatic savings should use real bank funds or the local demo wallet. The deployed Swagger inspected on October 10, 2026 includes savings goals and contributions, but no automatic income-saving or round-up configuration endpoint. Real automation requires backend rules, destination, amount/rate, consent, idempotent execution, and failure handling. Mono account linking alone does not authorize these transfers.
- Decide whether to add an app passcode/biometric lock and a development build. Native authentication and secure credential storage are not installed. Lock reminders must share the actual lock settings. Passcodes must not be stored in plaintext AsyncStorage.
- Trusted devices needs a backend device-session listing and revocation contract. Its switch currently reports this missing support instead of claiming protection.
- Screen protection requires a native screen-capture integration and verification of the platform's actual protection capabilities. It is currently off and explains the missing setup.
- Goal reminders need genuine notification permission handling, scheduling/cancellation, and reconciliation when goals change.
- Login settings and savings settings are still legacy placeholder implementations pending these product choices; their current switches are not proof that these features run. Do not treat their Saved alerts as implementation verification.

Verification: `node src/settings.test.cjs` checks concurrent saves, persisted settings, storage failures, and retry. Whole-project TypeScript currently has two pre-existing `StyleSheet.absoluteFillObject` errors in the inactive `appp` copy. No carousel animation implementation was changed.
