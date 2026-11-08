# In-app subscriptions

Membership now uses RevenueCat's native purchase SDK (`react-native-purchases`)
instead of a simulated success path.

## App configuration

Create an `MVP` entitlement in RevenueCat, attach the iOS App Store and Google
Play subscription products to it, and publish at least one package in the
current offering. The entitlement identifier is case-sensitive and must match
`EXPO_PUBLIC_REVENUECAT_ENTITLEMENT_ID`.

Add these **public SDK values** to the EAS environment used to build the app:

```text
EXPO_PUBLIC_REVENUECAT_IOS_API_KEY=<RevenueCat iOS public SDK key>
EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY=<RevenueCat Android public SDK key>
EXPO_PUBLIC_REVENUECAT_ENTITLEMENT_ID=<exact RevenueCat entitlement identifier>
```

Never put a RevenueCat secret API key in the app. Product IDs and prices are
loaded from RevenueCat's current offering, so the client does not invent a price
or store-product identifier.

## Purchase behavior

- RevenueCat is configured for the signed-in account's stable backend `userId`;
  email addresses and bearer tokens are not used as the purchase identity.
- Membership loads the current offering and localized store prices. Tapping a
  package opens the Apple or Google purchase sheet.
- MVP status changes only when RevenueCat returns the configured active
  entitlement and it is not marked verification-failed. User cancellation keeps
  the current plan. A purchase with no active entitlement shows a pending/error
  message and does not unlock MVP.
- The app refreshes status on app resume, listens for RevenueCat customer updates,
  supports restoring purchases and opens the store's subscription management.
- Profile and Membership read the same in-memory entitlement status. Signing out
  clears it and resets the RevenueCat customer session.

## Backend synchronization still required

The app has no confirmed backend subscription schema or RevenueCat webhook
endpoint. RevenueCat's result updates the signed-in app's status, but cannot by
itself update the TallySpends database. The backend must receive authenticated,
idempotent RevenueCat lifecycle webhooks, associate `app_user_id` with the
authenticated TallySpends user, persist purchase/renewal/cancellation/refund
status, and return the authoritative entitlement in the account response. Do
not accept a client-supplied `isPremium` flag or expose RevenueCat secret keys.

The backend developer must provide the webhook URL/authentication setup and the
exact account response schema before server-side status and billing history can
be shown. The app does not add subscription charges to the bank transaction
ledger.

## Build and test

RevenueCat uses native StoreKit and Google Play Billing, so real purchases do not
run in Expo Go. Build and install a fresh EAS development client after adding the
package and EAS environment values. Configure sandbox/test products and tester
accounts in both stores, then test purchase, cancellation, restore, renewal,
expiration, account switching, and sign-out. No live store purchase has been
tested from this workspace.
