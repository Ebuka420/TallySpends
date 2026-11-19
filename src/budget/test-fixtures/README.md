# Historical planning test fixtures

These files preserve the old local simulation solely for historical regression
cases. Production code must not import them. The production ledger module now
contains view models and helpers; all active reads and mutations use backend.ts
through repository.ts. Repository and backend tests exercise that actual path.
