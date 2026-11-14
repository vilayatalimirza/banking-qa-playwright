# Test strategy: ParaBank (one page)

**Goal.** Give confidence that money is never created, destroyed, duplicated or exposed, and produce evidence an auditor could follow. **Scope.** ParaBank web UI and its REST API: registration, login, accounts, transfers, bill pay, loans, statements. **Out of scope.** Performance/load (shared demo), real payment rails, real customer data.

## Risk-based approach
Each requirement (`data/requirements.ts`) is scored impact (1 to 5) x likelihood (1 to 5). Likelihood rises when behaviour is already known to be weak. Score decides the regression tier:

| Tier | Score | Runs | Contains |
|---|---|---|---|
| Critical | 15 to 25 | every push and PR, all of it | payments, amounts, idempotency, authorization, SCA, KYC, reconciliation, sessions |
| Standard | 9 to 14 | every push, nightly in all browsers | hardening, a11y, injection, ledger, money maths |
| Low | up to 8 | nightly | visual, self-service, framework self-checks |

The regression pack is therefore not "all tests": it is the Critical tier plus `@smoke` journeys in 4 browser configurations, justified by the matrix in `docs/TRACEABILITY.md`.

## Test levels
1. **Unit** (offline, seconds): money maths, parsing, helpers, guards.
2. **Contract**: page objects still match the real pages.
3. **API**: server-side rules without the UI (what the server enforces when no page validates).
4. **Hybrid**: UI creates the customer, API drives the state, UI verifies.
5. **E2E and negative**: user journeys, invalid input, idempotency, concurrency, network failure.
6. **Security, a11y, visual, compliance**.

## Oracles (how we decide pass/fail)
- **Invariants**: true in any bank (bank total unchanged by a transfer, debits equal credits, history append-only).
- **Requirements**: what a bank should do (reject negative, refuse overdraft). Violations are defects.
- **Observations**: what the system actually did (`findings/observations.jsonl`), kept so a failure can be diagnosed without re-running.

## Defect handling
Open defect = test tagged expected-to-fail with ID, written report, severity. Fix = test turns red by design, then the marker is removed. 38 tracked tests cover 20 IDs (19 defects plus the compliance gap GAP-001).

## Data and environment
Every test registers its own customer (unique username), so tests are independent and parallel-safe. No real data. The demo is shared: one pipeline at a time (concurrency lock), 1 worker in CI, retries 2 with trace on first retry; a pass-on-retry is reported FLAKY, never hidden.

## Evidence
Each pipeline run produces an evidence bundle: JSON and JUnit results, requirement outcome table, open defects, run metadata (commit, tool versions), traces/videos/screenshots of failures, and a SHA-256 manifest. Retention 90 days (policy value; real banks follow their record-keeping rules, often 5 to 7 years).

## Exit criteria
No Critical requirement FAILING (an open, documented defect is allowed and shown as DEFECT OPEN), no unmapped requirement, unit and contract green.
