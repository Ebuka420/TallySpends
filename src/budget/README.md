# My Budget

## Scope

`app/(tabs)/budget.tsx` is unchanged. Its My budget link still opens `/budgetspending`.
The new flow is `/budgetspending` → `/add-budget` → `/budget-details?id=…`.
Existing savings, joint savings, Ajo, and legacy spending-limit data are retained.

The amount input follows the supplied 23:21:33 recording: a full-screen amount,
borderless numeric keypad, backspace, and compact Continue action. Date entry
adapts its blurred bottom sheet and horizontal snapping selector to year/month/day.
All controls use the existing theme palette, including dark mode.

## Local financial model

This is explicitly a **device-local demo wallet**, not an account-backed bank ledger.
It reuses the application's opening balance of ₦2,926.78 and existing transaction
feed. It does not invent additional funding or turn old spending limits into money.

Amounts in `Budget`, `Activity`, and allocation commands are integer kobo. Existing
transaction amounts remain in naira at the application boundary; `minor()` validates
and converts their decimal representation before any ledger arithmetic.

- `available = opening balance + income − expenses − budget remaining balances`
- `allocated = remaining + spent` for each bucket. Allocated is the net amount
  retained in that bucket, including what has been spent; releases/transfers adjust it.
- Transfers and releases are allocation events, not expense transactions.
- Periods do not reset or confiscate money. Date ranges only govern transaction matching.
- Spending this month uses current canonical expense records attached to budgets.

`repository.ts` serializes operations and stores transactions, budgets, deductions,
and audit events together under `ts_demo_wallet_v1`. It publishes a new snapshot only
after storage succeeds. `ts_txs` remains untouched as the migration backup;
`ts_bgts` remains the legacy limit store for unrelated consumers. App reset resets
the demo ledger as well. Storage errors do not silently replace saved money.

`useAppStore()` exposes the shared snapshot and available balance. The dashboard,
transfer and withdrawal screens use that balance; existing transaction forms wait
for the save result. These are data integrations, without redesigning those screens.

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

Run the financial and storage tests with Node 24:

```sh
node --test src/budget/ledger.test.cjs src/budget/repository.test.cjs
node node_modules/typescript/bin/tsc --noEmit
node node_modules/expo/bin/cli export --platform ios --output-dir .expo/budget-ios-check
```

The tests cover conservation, insufficient funds, atomic plans, concurrent writes,
failed persistence, migration, restart, category matching, edits/deletions,
transaction and payment-reference retries, and disabled real payments.

Device acceptance checks still required: on iOS and Android, create a budget,
enter decimals/backspace, open each date wheel and test February/month boundaries,
complete funding, add/move/release money, reopen after restart, record and assign an
expense, check dark mode, small screens, keyboard avoidance and back navigation.
The native bundle validates compilation, not these visual/gesture behaviours.

Verification on 2026-09-19: 23 financial/storage tests passed; focused ESLint passed
for all budget files and `src/store.ts`; iOS and Android exports succeeded. The
whole-project TypeScript check still reports pre-existing `absoluteFillObject`
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
