# Account profiles

**Current behavior:** [BACKEND_SYNC.md](./BACKEND_SYNC.md) documents the read-only
profile, removed Nickname, rejected device-only saves and remaining full-field
backend requirements. It supersedes earlier editor/local-preference details below.

The profile, dashboard avatar, More page and Tally Request badge share one reactive
profile snapshot. There are no sample names, contact details or TallyTags in the
initial profile. Sign-out clears it immediately and blocks hydration until the
next sign-in. Requests from an earlier account cannot publish into a new account.

## Deployed backend integration

Verified in Railway Swagger on 2026-10-11:

- `GET /api/users/me`: load the authenticated user's profile.
- `PATCH /api/users/me`: JSON containing `fullName`, `phoneNumber`, or `avatarUrl`
  for the fields being changed. The documented schema also supports
  `defaultCurrency`; this feature does not change it.
- `POST /api/users/me/avatar`: multipart form field **file** containing the selected
  image. Fetch supplies the multipart boundary. Local image paths are never saved
  as an account photo.

Uploads read `new File(uri).bytes()` from `expo-file-system` before networking, as documented in
[Expo's upload guide](https://docs.expo.dev/versions/v54.0.0/sdk/filesystem/#uploading-files-using-expofetch).
The profile client explicitly uses `expo/fetch`, whose multipart converter
explicitly rejects the legacy React Native `{uri, name, type}` format before a
request reaches the backend. `upload.ts` supplies a prepared byte-backed part with
the picker's image MIME type and a generic filename, such as `profile.jpg`.
It does not rely on lazily reading native file metadata during network setup or
send the original photo filename/local path. FileSystem 57.0.7 was already installed transitively and is declared as
a direct dependency at the same compatible version.

Local file-read failures now report preparation errors before any HTTP request.
Upload network failures identify the photo request, and a failed GET after an
accepted upload asks the user to refresh before uploading again. These paths
preserve the last confirmed photo instead of replacing it with a local preview.
The endpoint's existence/unauthenticated reachability does not verify a successful
authenticated iPhone upload; that still needs an actual device retry.

All requests use the existing HTTPS API base URL and Bearer token, with one
refresh attempt using `/api/auth/refresh`. A 20-second timeout and duplicate-save
guard are applied. Updated details are re-read from GET after the backend returns
HTTP 200. An upload is displayed only after GET returns its persisted HTTPS
`avatarUrl`; the frontend does not invent a public URL from a device file path.

Swagger does **not** declare a response schema for these operations. The adapter
accepts a flat object with `fullName`, `email`, `phoneNumber`, `tallyTag`, and
`avatarUrl` (null when absent). These field names match the login/profile update
contracts; the actual authenticated GET and upload responses still need physical
device testing or a redacted backend example. Unknown envelopes and invalid photo
URLs produce an error instead of a fabricated profile. The backend must return
its saved photo URL from GET and make it usable by the mobile Image component
without exposing credentials in the URL.

## Local account preferences and migration

Profiles are cached under `ts_account_profile_v1_<encoded-owner>`, preferring the
backend user ID and using the authenticated email when the login omits an ID.
Custom categories also use that owner rather than a mutable username. Owners
must be stable across logins; returning `userId` consistently is recommended.

Old shared `ts_profile_*` and `ts_username` records are ignored, not assigned to
whoever signs in next. Their owner cannot be established safely. Existing local
photos must be selected again to upload them to the correct account.

Nickname, gender, DOB and address have no documented backend update fields. They
are saved in the account-specific cache, with a message that they currently apply
on this device. Backend support is required for synchronization across devices.
Email and TallyTag edits are rejected rather than falsely changing account
identity locally. Backend endpoints for verified identity changes are required.
The existing password dialog no longer claims that local storage changed the
server password; a secure backend password-change endpoint is required.

## Other device data

This change covers profile identity, photo, profile preferences and custom
categories. Theme/display preferences intentionally remain device preferences.
The existing local demo wallet, legacy savings/budget records, sample saved cards,
local notification history and onboarding records still have their existing
storage behavior. They are not backend-synchronized account records. Migrating
those features requires a separate ownership/data migration, rather than silently
assigning shared historical data to the next signed-in user.

## Validation

`node src/profile/profile.test.cjs` checks account isolation, exclusion of legacy
shared data, cache persistence, authenticated PATCH, multipart upload, unsupported
identity edits, refresh, unconfirmed responses and stale-response protection.
Use two test users on one device, then the same user on a second device to verify
the backend's persisted profile and publicly usable photo URL. Live authenticated
requests and physical iPhone/Android uploads have not been exercised here.
# Read-only profile update

See [BACKEND_SYNC.md](./BACKEND_SYNC.md) for the current read-only screen, removal
of Nickname and device-only saves, and the exact remaining all-field sync needs.
It supersedes older editing/local-preference behavior described below.

