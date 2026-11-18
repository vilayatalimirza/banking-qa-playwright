# Test strategy: ParaBank (one page)

**Goal.** Give confidence that money is never created, destroyed, duplicated or exposed, and produce evidence an auditor could follow. **Scope.** ParaBank web UI and its REST API: registration, login, accounts, transfers, bill pay, loans, statements. **Out of scope.** Performance/load (shared demo), real payment rails, real customer data.

## Risk-based approach
Each requirement (`data/requirements.ts`) is scored impact (1 to 5) x likelihood (1 to 5). Likelihood rises when behaviour is already known to be weak. Score decides the regression tier:

| Tier | Score | Current CI treatment | Contains |
|---|---|---|---|
| Critical | 15 to 25 | Included in the full Chromium suite on every push/PR and nightly run; critical smoke journeys also run in the other configured browser/viewports | payments, amounts, idempotency, authorization, SCA, KYC, reconciliation, sessions |
| Standard | 9 to 14 | Included in the same full Chromium suite on every push/PR and nightly run | hardening, accessibility, injection, ledger and money maths |
| Low | up to 8 | Included in the Chromium suite where covered by the configured paths; visual checks run in a separate advisory job | visual, self-service and framework self-checks |

**Important implementation detail:** risk tiers currently prioritize test design and triage; they do not yet select separate CI subsets. The workflow runs the complete non-visual functional/API/security/accessibility/compliance suite in Chromium, plus a tagged `@smoke` matrix in Firefox, WebKit and Pixel 7 emulation. Visual comparison is a separate advisory job until Linux baselines are committed. See `docs/TRACEABILITY.md` for the test-to-requirement mapping.

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
A tracked finding is an expected-failure test with an ID and a written report. When behaviour changes, the guard becomes an unexpected pass and must be re-triaged before its marker is removed. The current registry contains 36 test titles across 21 identifiers: 19 BUG IDs and two compliance gaps (GAP-001 and GAP-002). BUG-006 and BUG-019 remain marked to-confirm. BUG-011 and BUG-020 are documented findings but are not currently registered as expected-failure guards.

## Data and environment
Every test registers its own customer (unique username), so tests are independent and parallel-safe. No real data. The demo is shared: one pipeline at a time (concurrency lock), 1 worker in CI, retries 2 with trace on first retry; a pass-on-retry is reported FLAKY, never hidden.

## Evidence
Each pipeline run produces an evidence bundle: JSON and JUnit results, requirement outcome table, open defects, run metadata (commit, tool versions), traces/videos/screenshots of failures, and a SHA-256 manifest. Retention 90 days (policy value; real banks follow their record-keeping rules, often 5 to 7 years).

## Exit criteria
No Critical requirement FAILING (an open, documented defect is allowed and shown as DEFECT OPEN), no unmapped requirement, unit and contract green.
