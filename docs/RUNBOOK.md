# Runbook: banking-qa-playwright

How to run, read and maintain this suite. Everything runs against the public ParaBank demo (shared, resets sometimes, rate-limited).

## Suites

| Folder | Purpose | Tags |
|---|---|---|
| `tests/unit` | Pure logic and helpers, no ParaBank | |
| `tests/contract` | Every page-object locator matches exactly one element | |
| `tests/e2e` | Core journeys through the UI | `@smoke`, `@critical` |
| `tests/negative` | Boundary and abuse cases (amounts, double-click, race, injection) | `@negative`, `@idempotency`, `@race` |
| `tests/api` | REST API contract, tampering, probes | `@api` |
| `tests/hybrid` | API setup, UI verification and the reverse | `@hybrid` |
| `tests/resilience` | Network failure simulation | `@resilience` |
| `tests/security` | Sessions, access control, headers, login controls | `@security`, `@auth` |
| `tests/a11y` | axe-core WCAG scan, keyboard login | `@a11y` |
| `tests/visual` | Screenshot comparison (own project) | `@visual` |

## Commands

Run from the repository root:

```powershell
npm ci
npx playwright install chromium
npm run check                    # TypeScript typecheck + offline unit tests
npm run test:full                # Full Chromium functional/security/API suite
npm run test:smoke               # Critical Chromium journeys
npm run test:cross-browser       # Firefox, WebKit and Pixel 7 smoke projects
npm run test:visual              # Visual snapshots for the current OS
```

Targeted debugging:

```powershell
npx playwright test tests/security
npx playwright test tests/e2e/profile.spec.ts --headed
npx playwright test --grep "@smoke"
npx playwright show-report
```

Generate reports:

```powershell
npm run report:defects
npm run report:findings
npm run report:traceability
npm run report:metrics -- test-results/results.json
npm run report:evidence
```

## Reading a result

`findings/observations.jsonl` is cleared at the start of every run. Run `scripts/summarize-findings.ts` right after the run you care about, before starting another.

- **Expected defect failure:** a registered, documented defect guard failed as expected. This is not a successful requirement check and is excluded from pass-rate calculations.
- **Expected pass:** the test passed on the first attempt.
- **Flaky:** the test failed initially but passed on retry. It remains visible as flaky; it improves the final pass rate but not the first-attempt rate.
- **Unexpected failure:** an ordinary test failed after retries, or a defect guard failed to meet its expected outcome. Inspect the trace and findings.
- **Unexpected pass of a defect guard:** the behaviour may have changed. Reproduce it and update the finding before removing the marker.
- **Skipped / not run:** reported separately and excluded from the pass-rate denominator.

The metrics apply to the merged full Chromium functional suite only. Unit/typecheck, cross-browser smoke and visual jobs are separate CI jobs.

## Triage workflow for a new red

1. Is the test wrong? Check the trace and observation row first (`summarize-findings`).
2. Reproduce it twice (`--repeat-each=2`) and, for money bugs, once through the API.
3. Write a `## BUG-0xx` section in `docs/BUG-REPORTS.md` (template: `docs/bug-report-template.md`): steps, expected, actual, frequency, impact, severity and priority.
4. Register the exact test title in `data/known-defects.ts`. Guard tests enforce that every registered defect has a report and every spec that needs it imports the tracking fixture.

## Debugging

- `npx playwright test <file> --headed --debug` steps through with the inspector.
- `npx playwright test --ui` is the time-travel runner.
- Traces keep a DOM snapshot before and after every action; the failing step is the first red one, and the error text names the locator.

## CI

`.github/workflows/playwright.yml` (GitHub Actions) and `.gitlab-ci.yml` (GitLab CI) run typecheck/unit, the full Chromium suite, cross-browser smoke (Firefox, WebKit, Pixel 7), and visual regression. GitHub Actions merges the Chromium shards before generating the run metrics, full traceability and audit-evidence bundle.

The public demo is shared and rate-limited. GitHub Actions serializes the two Chromium shards, then the cross-browser smoke jobs, then visual regression; this avoids simultaneous jobs competing for demo state. A workflow-level concurrency group prevents overlapping workflows from running against the demo at once.

## Visual regression

Baselines are operating-system specific. The committed snapshots were captured on Windows; Linux comparisons are advisory until Linux baselines are captured, reviewed and committed. Generate baselines on the same OS where they will be compared. The GitHub Actions workflow has a manual `update_snapshots` input to capture Linux baselines as an artifact.

## Cross-browser notes

Only `@smoke` tests run in Firefox, WebKit and the mobile viewport. ParaBank is not responsive, so mobile findings are about layout and tap targets, not a separate mobile app.
