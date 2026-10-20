# App access and confirmation

Returning sessions restore authenticated routing from the existing token/profile
store and enter `/unlock`, never the sign-up form. The root Stack stays mounted;
Expo Router guards expose only unlock while locked and remove authenticated
screens (including modal reviews) from navigation. Leaving the app hides protected
screens, clears entered PIN/password values, invalidates in-flight unlock results,
and cancels pending transaction authorization. A normal return before 60 seconds
does not require another unlock; 60 seconds or longer does. Wall-clock and
monotonic elapsed time are checked on resume, without trusting background timers.
Clock rollback also forces locking. Cold starts always start locked, including
after a process kill or device power cycle. QR intent resumption waits for unlock.
Explicit logout removes the server session and returns to sign-in.

New accounts choose and confirm six digits after employment and before the
completion screen. Existing sessions without a device PIN must create one on
first access. PIN records are per account, in Expo SecureStore with device-only,
when-unlocked access: a random salt, SHA-256 verifier, failure count, cooldown,
and biometric preference. Plain PINs never enter storage, logging, or routes.
Five failures start a 30-second cooldown; subsequent failures back off up to an
hour. The counter survives process restarts. This is a device app lock, not a
server transaction PIN or protection against a compromised operating system.

Forgot PIN verifies a fresh password via the existing POST /api/auth/login.
A successful response must identify the same account and provide an access
token. No local-password or offline success is accepted. The user then chooses
and confirms a replacement PIN; biometric opt-in is reset. Recovery requires a
network connection and the account password. Backgrounding invalidates recovery.
Account-password recovery without the current password still requires backend
email/OTP reset endpoints, expiration, rate limits, and account-safe responses.

Settings > Login Settings > Reset Password calls the documented authenticated
POST /api/auth/change-password with currentPassword/newPassword, then ends the
local session so the user signs in with the new password. It does not invent a
forgotten-password endpoint. The new page explains the distinction. The former
placeholder login switches have been replaced with PIN status, reset PIN, a
persisted biometric switch, and Lock app now.

Enabling biometrics requires an enrolled device biometric verification.
Disabling requires fresh PIN or biometric verification. Opt-in users receive
native prompts on app entry/resume and transaction confirmation. Cancellation,
lockout, and unavailable hardware leave PIN fallback; OS passcode fallback is
disabled and Android uses strong biometrics. Fingerprint/Face ID templates are
managed by the OS and are never read or stored by the app.

Transfer and withdrawal confirmation use a one-use in-memory authorization,
consumed for the captured action. Review modals dismiss before authentication
to avoid stacking native modals on iOS. Existing demo/unsupported payment states
stay unchanged: this does not add money movement. Real payments require backend
authorization bound to recipient/amount/nonce/expiry, replay prevention and any
required server step-up verification; local biometrics alone are not server proof.

Pending signup credentials now use SecureStore and are deleted after completion.
Legacy pending data migrates out of AsyncStorage. Legacy cached profile passwords
are stripped during hydration; offline password login has been removed. The
existing bearer-token storage/client architecture is otherwise retained.

Native packages match installed Expo 57's bundled versions, without upgrading
Expo: expo-local-authentication ~57.0.3, expo-secure-store ~57.0.4, expo-crypto
~57.0.3. Face ID usage text and SecureStore plugin are configured in app.json.
Expo's requested v54 documentation URLs currently redirect to latest; the local
installed module manifest was used to select compatible dependencies.

Run `node src/security/security.test.cjs` for mocked storage, rate-limit,
account-isolation, onboarding migration, password recovery and request checks.
No live password change or money transfer is performed by these tests.

Device acceptance required: sign up through all four steps; reopen a saved
session; verify background/resume and deep links cannot bypass unlock; enter five
wrong PINs and restart; recover with wrong/correct passwords; switch accounts;
cancel and retry biometric prompts; disable biometrics with PIN fallback;
confirm/cancel withdrawal; verify reduced motion and screen reader labels.
iOS Face ID needs a development/installed build and cannot be tested in Expo Go.
Login Settings now explains this limitation in the app and prevents enabling
Face ID in iPhone Expo Go. PIN access remains available; unsupported automatic
biometric prompts are skipped. Installed builds still verify hardware/enrollment
through the OS before enabling biometrics. Changing the authenticated account
remounts the security session in its locked state and cancels the old confirmation.
Mobile secure storage is required; web access fails closed with a clear message.

## Screen-off detection and the one-minute grace period

`modules/tally-device-lock` is a local Expo module, discovered through Expo's
default modules directory. Android registers ACTION_SCREEN_OFF in native code;
iOS observes the public protected-data-unavailable notification on passcode-enabled
devices. Native callbacks retain a flag even while JavaScript is suspended and
also notify JS, so a short phone lock still requires unlock. No lock-screen
credentials or biometric templates are read. A successful app unlock clears stale
screen-off flags. Native biometric prompts do not start the ordinary inactivity
clock, so Face ID/Touch ID cannot accidentally relock their own confirmation.

A new native development/installed build is required. Expo Go has no custom
module, so it conservatively locks on every departure rather than treating an
unknown screen-off event as a safe quick return. The same fallback applies if the
module fails or iOS has no passcode and cannot reliably signal protected-data
locking. Native source compilation and physical-device acceptance are required;
autolinking/JS exports alone cannot prove screen-lock delivery on each OS.

The SDK-matched expo-dev-client package is included for the existing EAS
development profile. Build and install with `eas build --platform ios --profile
development` (or `--platform android`), then run `npm run start:dev` to connect
the installed client to Metro. iOS device registration and Apple signing must
be completed under the project's own Apple/Expo account. No build was submitted
or installed automatically. The preview profile remains an alternative installed
build without the development client workflow. Run `npm run typecheck` for the
active app; the inactive appp snapshot is deliberately excluded.

Verify on devices: switch apps for 59 seconds and for 60+ seconds; lock the phone
for 5 seconds while this app is foregrounded and while it is backgrounded; turn
the device fully off and restart; verify OS biometric prompts do not relock;
cancel a transfer before leaving and confirm it cannot resume automatically.
