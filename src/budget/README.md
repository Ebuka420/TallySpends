# Budget, Savings and Ajo

## Scope

The main Budget tab retains its themed card design and now includes a consistent
information guide and live reserved/available balances. My Budget, personal savings, joint
savings and Ajo share a persistent local data store. Only budgets and savings
reserve wallet money; Ajo is an external-payment ledger.

- Budgets: create, fund, record/assign expenses, add/move/release money, rename,
  archive and restore. Spent-up and ended-period buckets have explicit next steps.
- Savings: name/target/unlock date, optional initial deposit, contributions,
  locked withdrawals, completion, archive and history. Joint goals require unique
  TallyTags and all participants' acceptance before funding.
- Ajo: validated member tags, weekly/bi-weekly/monthly collections, a fixed payout
  order, recorded member agreement, contributions, payout records, corrections,
  completion and archive. Members pay outside Tally; the app only records it.

Screens use fewer stacked explanation cards. Secondary history, sample plans and
options expand on demand. Named back links and post-action Done buttons return
directly to the appropriate list with `dismissTo`, including dashboard deep links.

Search, selected members, review screens, group lists and payout records
use shared avatar/TallyTag components. Existing photos are displayed; missing
or broken photos use initials, never unrelated stock portraits. Search currently
uses public display fields from locally registered users and saved participants.
It is explicitly not a connected/verified user directory. Member snapshots contain
only tag, display name, photo URI and optional user ID—not passwords or contact data.

Dashboard joint-savings and Ajo carousels use live selectors from the same snapshot.
They show actual goal progress, dates, member agreement, recorded contributions and
the next recipient, and route by the real local record ID. Empty, archived,
completed and earlier-demo states never retain fake active cards or divide by zero.
Smart Insights, Ajo and joint savings now render through `HomeCarousel`, including
empty states, so card dimensions, typography, icons, spacing and pagination match.

Static example savings balances/circles were presentation placeholders, not saved
money; they are replaced with honest empty states. Unrelated legacy data is untouched.

Budget amount entry follows the 09-19 16:24:59 recording: borderless numeric keys,
a pill Continue button and compact frequency/month-day/weekday selection sheets.
Frequency sets one funded period; it does not promise automatic recurring top-ups.
Savings retains the earlier 09-18 23:21:33 keypad and horizontal snapping date wheels.
All controls use the existing palette, including dark mode, and scroll on small screens.

## Local financial model

This is explicitly a **device-local demo wallet**, not an account-backed bank ledger.
It reuses the application's opening balance of ₦2,926.78 and existing transaction
feed. It does not invent additional funding or turn old spending limits into money.

Amounts in `Budget`, `Activity`, and allocation commands are integer kobo. Existing
transaction amounts remain in naira at the application boundary; `minor()` validates
and converts their decimal representation before any ledger arithmetic.

- `available = opening balance + income − expenses − budget remaining − savings held`
- `allocated = remaining + spent` for each bucket. Allocated is the net amount
  retained in that bucket, including what has been spent; releases/transfers adjust it.
- Transfers and releases are allocation events, not expense transactions.
- Periods do not reset or confiscate money. Date ranges only govern transaction matching.
- Spending this month uses current canonical expense records attached to budgets.
- Archiving a budget releases only its unspent amount. History remains, and restoring
  never invents new funding. A later refund of an archived expense goes to available.
- Savings target limits and unlock dates are enforced by the reducer, not just buttons.
- Ajo contributions and payouts never debit, credit or reserve wallet money, even
  with zero available balance. Each full contribution is recorded once per member
  per round, with a date and optional reference. Corrections void the current-round
  entry while keeping its audit trail. Payout recording requires all contributions,
  validates dates, follows the fixed order and advances the round once. These are
  manual records, not bank-verified receipts. Monthly schedules retain the anchor day.

Earlier Ajo wallet simulations are preserved as read-only `legacy-demo` history on
load. Outstanding demo reservations are released; previous simulated transactions
are retained, not silently reversed or relabelled as real payments. Before migrating,
the original document is backed up as `ts_demo_wallet_v1_before_ajo_tracking`.
Migration is idempotent, and write failures publish no changed balances.

`repository.ts` serializes operations and stores transactions, budgets, deductions,
audit events, savings and circles together under `ts_demo_wallet_v1`. It publishes a new snapshot only
after storage succeeds. `ts_txs` remains untouched as the migration backup;
`ts_bgts` remains the legacy limit store for unrelated consumers. App reset resets
the demo ledger as well. Storage errors do not silently replace saved money.

`useAppStore()` exposes the shared snapshot and available balance. The dashboard,
transfer and withdrawal screens use that balance; existing transaction forms wait
for the save result. Transfer, deposit and withdrawal retain their themed layouts
with shared review steps, duplicate-submit protection and recorded receipt details.

## Transaction matching and reconciliation

New expenses automatically use the sole category/date-matching budget. Food,
restaurant, bills and school aliases map to the existing category names. Ambiguous
matches or insufficient budget funds fall back to available money only if it covers
the expense, and surface a review message. Budget details let users assign those
existing expenses without creating a second transaction.

Explicit `budgetId` spending cannot exceed that bucket's balance. Edits and deletions
reverse the original deduction and retain an audit trail. Operation IDs prevent
allocation retries; transaction IDs prevent feed retries. A stable, provider-issued
`paymentReference` reconciles a direct payment with its later feed echo, including
the overall cash balance. Conflicting amounts for a reference are rejected. Do not
deduplicate unrelated purchases by guessing from merchant, amount or date.

Manual expenses without a shared provider reference cannot be automatically
identified as the same payment as a future bank feed record. The UI tells users not
to record an expense already in history. A banking integration must supply canonical
references or an explicit matching workflow; no bank feed currently exists here.

`budgetPayments.pay()` deliberately rejects while `available` is false. The Pay
action explains this and offers recording an expense already paid. It never calls
the existing demo transfer screen or pretends to send money.

The sample plan is clearly labelled and deterministic. `allocate` accepts multiple
allocations and commits all or none, ready for a future validated Coach plan. The
existing chat API has no structured allocation contract and is not invoked here.

## Checks

The September 23 follow-up unifies deposit and withdrawal screens with a balance
preview, method selection, amount shortcuts, review and recent receipts. Transfers
show all six additive shortcuts, including ₦200, ₦5,000 and ₦10,000. Every newly
saved wallet transaction returns to Home and opens its receipt after navigation;
failed writes stay in the current flow. This also covers quick, scanned and
budget-recorded expenses. Existing receipt views do not create transactions.

Receipts share one card and image-sharing implementation. Transaction history
supports combined type, date, category and amount filters, search, four sort
orders, grouped dates and totals for the selected results. Filter changes are
staged until applied. Amount sorting retains amount order instead of regrouping
by date. Amount filters use the same budget keypad without scheduling controls.
`src/transactions/history.test.cjs` covers these selectors and the completion
notification/navigation contract. Browser discovery still returned no connected
browser, so receipt placement, nested sheets and navigation need device checks.

The September 22 UI refresh restores compact dashboard carousels, the savings
goal list and Ajo overview, keeps live record navigation, and adds short planning
tips and a three-section information guide on Budget. All amount fields use the
budget keypad; ordinary money entry has no scheduling controls. The Insights
Summary keeps its existing layout and reads the transaction snapshot for weekly,
monthly and custom ranges, equal-duration comparisons, chart/heatmap values and
local answers to supported spending questions. It does not call an AI service or
invent activity for empty periods. The date range controls all reported figures.

Additional checks: `node --test src/insights/summary.test.cjs` covers boundaries,
decimal aggregation, invalid data, empty periods, data-based answers and recorded
receipt metadata. Browser discovery returned no connected browser during this
refresh; on-device visual and gesture checks still need a running app.

Run the financial and storage tests with Node 24:

```sh
node --test src/budget/ledger.test.cjs src/budget/planning.test.cjs src/budget/repository.test.cjs src/budget/dashboard.test.cjs src/insights/summary.test.cjs src/transactions/history.test.cjs
node node_modules/typescript/bin/tsc --noEmit
node node_modules/expo/bin/cli export --platform ios --output-dir .expo/budget-ios-check
```

The tests cover conservation, insufficient funds, atomic plans, concurrent writes
across savings and budgets, failed persistence, migration, restart, category matching,
edits/deletions, archive/restore, spent-up buckets, invitation validation, savings
locks, full Ajo tracking cycles, corrections, migration backups, dashboard selectors,
profile projection/search, month boundaries, retries, and disabled real payments.

Device acceptance checks still required: on iOS and Android, create a budget,
enter decimals/backspace, open frequency and day sheets, open savings date wheels,
complete funding, add/move/release money, reopen after restart, record and assign an
expense, create personal/joint goals, search/select people, check actual and missing
photos, release unlocked savings, archive, and record every Ajo round. Check carousel
empty/single/multi-card updates and detail destinations. Check dark mode, small screens,
keyboard avoidance, modal dismissal, named back links and Done navigation.
The native bundle validates compilation, not these visual/gesture behaviours.

Verified on 2026-09-23: all 69 tests, the whole-project TypeScript check and
iOS/Android exports pass. The history search tests also cover formatted amounts
with decimal places. No browser was connected for visual acceptance testing.

Verified on 2026-09-22: all 62 tests (including Insights Summary and receipt
presentation), the whole-project TypeScript check, and iOS/Android exports pass.
The three outdated `absoluteFillObject` references below were replaced with
`absoluteFill`. No browser was connected for visual acceptance testing.

Verified on 2026-09-20: all 56 financial, storage, people and dashboard tests pass,
focused lint passes without warnings, and iOS and Android exports succeed. The
whole-project TypeScript check still reports three pre-existing `absoluteFillObject`
errors in `app/(tabs)/_layout.tsx`, `app/settings-dashboard.tsx`, and
`components/RadialFloatingBot.tsx`. Whole-project lint also reports unrelated
existing errors. No connected browser or mobile runtime was available for the
device acceptance checks above; those checks remain open.

## Before connecting real money

Replace the local repository with authenticated, user-scoped server operations,
transactional balance checks, idempotency keys and authoritative reconciliation.
The existing shared demo transaction store is not a multi-user account ledger.
Add actual bank account sources and verified payment status before enabling Pay.
The current single-runtime queue does not coordinate separate devices/browser tabs.
Add a structured, validated Coach allocation response before presenting AI plans.

Joint-savings invitations remain a labelled local preview and only the owner's
contributions are tracked. Connect user lookup, delivery/acceptance, shared balances
and authoritative locks/approvals before shipping shared savings.

## Backend handoff: ledger-first Ajo

The supplied backend note specifies Ajo groups, memberships and contributions with
payments made between members outside the app. No API documentation, routes or schemas
were available, so this implementation does not invent endpoints or claim remote sync.

Map the local circle's metadata to the group resource, participants/user IDs and payout
positions to memberships, and payment/date/reference records to contributions. The
`record-membership`, `record-ajo-contribution`, `undo-ajo-contribution` and
`record-ajo-payout` commands describe frontend intent, not assumed HTTP route names.
Confirm payout recording, corrections, authentication, organizer/member permissions,
membership consent, idempotency and pagination against the actual backend contract.
Replace the local repository boundary when those endpoints are supplied; do not add
wallet debits or bank transfers to this tracking-only Ajo flow.
