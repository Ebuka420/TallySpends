# Dashboard account carousel

The balance section is now a responsive debit-account carousel, approximately
91% of screen width with a small left inset and a thin next-account peek. The
first card is always TallySpends. It uses the existing logo, a predominantly white
light-theme surface, faint purple curves, a decorative chip and the existing
currency formatting/privacy toggle. Dark mode uses the existing dark surface.
The monthly percentage/arrow is removed. Deposit, Withdraw and Transfer keep
their routes and payment behavior, with 46px circles and generous touch areas.

Linked cards use only records returned by the existing bank adapter. Catalogue
logos and bank colors are selected by an explicit bank slug or matched bank
name; unknown banks use a premium purple fallback. No PAN, expiry, CVV or network
branding is generated. These are account representations, not issued cards.

## Circular behavior

The installed Gesture Handler and Reanimated libraries animate an unbounded
turn value. Modulo-positioned copies form a repeating ring, so wrapping does
not call scrollTo or visibly reset a list. Rightward horizontal gestures advance
one account; leftward/vertical gestures do not select another account. Movement
is resisted and capped to one step, animations are locked during snapping, and
cancelled gestures snap back. The next account enters from the left as the active
account exits right; a separate, noninteractive copy keeps the next-account peek
at the right edge when idle. All copies show the same backend-derived data.

Spring transitions use overshoot clamping. Selection triggers a gentle haptic;
reduced-motion mode skips travel and haptics. An accessibility “Next account”
action offers the same forward-only navigation. With one account, gestures and
pagination are disabled. A subtle plus opens the existing Mono route.

## Data integrity and refresh

`useDashboardAccounts` reuses `bankBackend.listAccounts`, `src/api.ts`, bearer
authentication and token refresh. It loads on dashboard focus, including return
from Mono, and supports pull-to-refresh. Identity changes isolate account state.
Successful refreshes replace the account list, so removed accounts disappear.
Selection is preserved by account ID across reordering/updates; if that account
is removed, the overview becomes active. Failed refreshes retain account identity
but discard stale balance/transaction fields and offer a retry. Requests are
cancelled on blur/unmount and time out after 15 seconds.

**The existing overview balance is a local demo-wallet calculation, not a live
backend consolidated balance.** Its amount/definition is preserved, but the card
explicitly says “Local demo overview”. Bank balances are never added to this
wallet or summed to create a fabricated consolidated balance. A wallet that has
not loaded shows unavailable rather than a fabricated zero.

The optional bank adapter fields currently supported are:

```ts
{
  id: string;
  bankName: string;
  accountName: string;
  maskedAccountNumber?: string;
  bankSlug?: string;             // existing bank catalogue slug
  availableBalance?: number;    // major currency units, e.g. naira, not kobo
  currency?: string;            // ISO currency, required to display bank balance
  transactions?: Array<{
    id: string;
    title: string;
    amount: number;             // positive major units
    type: "income" | "expense";
    date: string;
    category?: string;
  }>;
}
```

These optional fields are a frontend capability, **not a verified deployed
response contract**. Absent/invalid balances show “Balance unavailable”, not zero.
The actual zero is supported when the backend explicitly supplies it. Selecting
a bank shows only its supplied transactions, or an unavailable/empty state. The
unfiltered View all link is disabled for bank selection to avoid opening wallet
transactions as if they belong to the selected bank. No filtered API is invented.
Bank transactions use their explicitly supplied account currency; if currency is
missing, an unavailable state prevents formatting unknown amounts as naira.

## Backend support still needed

The public Swagger checked on October 9, 2026 lists `GET /api/accounts/me` but
does not document its response schema. Its bank-account semantics remain to be
confirmed. `/api/transactions` and `/api/analytics` do not document account-ID
filters. There is no documented live consolidated available-balance contract.
The bank-link endpoint is now deployed and bearer-protected, as verified in
README.md. Linked-account retrieval and successful response schemas remain
undocumented.

The backend developer needs to confirm the actual account-list schema, stable
identifiers, balance currency/units/freshness, and which records represent a
completed Mono link; provide the real consolidated overview and its definition;
and add/document account-scoped transactions/analytics and unlink synchronization.
Consolidated flows must exclude internal-transfer double counting. No client-side
sum of bank balances or income-minus-expenses is assumed to be that overview.
Payment actions still act on their existing wallet flow: bank linking does not
authorize transfers or introduce bank payment capabilities.

The header, Smart Insights, Ajo/planning sections, bottom tabs and floating bot
are preserved. The pre-existing Smart Insights and planning data are not claimed
to be bank-specific analytics. A real analytics contract is needed before those
sections can be scoped without fabricating values.

## Verification and build requirements

`node src/banking/carousel.test.cjs` covers one-way acceptance, single-card mode,
hundreds of wraps, continuous incoming positions, one-step progression,
selection after refresh/removal, missing versus zero balances and responsive
peeking from 320 to 768px widths. Existing bank adapter tests remain applicable.
Both iOS and Android JavaScript bundle exports completed successfully.
No new dependencies or native configuration were added for this carousel. A new
development build is not needed for these changes if the installed binary
already contains the project's existing native dependencies. OTA cannot add
native modules missing from an older binary.

Physical iOS/Android verification is still required for gesture feel, visual
matching, haptics, accessibility actions, dynamic Mono-linked accounts, vertical
scrolling and reduced-motion settings. No device/browser session was available
in this workspace. TypeScript still reports two unrelated absoluteFillObject
errors in the duplicate `appp` directory.
