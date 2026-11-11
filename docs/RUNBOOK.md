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

```
npx playwright test tests/unit                                    # seconds, run before every commit
npx playwright test --grep @smoke                                 # critical journeys
npx playwright test tests/security                                # one area
npx playwright test -c playwright.ci.config.ts                    # everything: all projects, retries, junit + html
npx playwright test -c playwright.ci.config.ts --project=firefox-smoke
npx playwright test -c playwright.ci.config.ts --project=visual --update-snapshots   # (re)create visual baselines
npx playwright show-report                                        # open the last HTML report
npx tsx scripts/summarize-findings.ts                             # what the app actually did, as tables
npx tsx scripts/defect-register.ts                                # open-defect register
```

One-time setup for the extra projects: `npm i -D @axe-core/playwright` and `npx playwright install firefox webkit`.

## Reading a result

> `findings/observations.jsonl` is cleared at the start of every run. Run `scripts/summarize-findings.ts` right after the run you care about, before starting another.

- **Green with "expected failure" tests:** the suite is healthy. Open defects are listed in `data/known-defects.ts` and shown as passed.
- **"Expected to fail, but passed":** a defect was fixed (or stopped reproducing). Re-run it a few times (`--repeat-each=5`); if it is consistently fixed, delete its entry in `data/known-defects.ts` and mark the report resolved.
- **Red with a raw error:** a new finding, or a broken test. Open the trace: `npx playwright show-trace <path to trace.zip>`.
- **Flaky (passed on retry, CI only):** never ignore it. Find the cause (a missing wait, shared state, the demo being slow) or quarantine with `test.fixme` plus a ticket.

## Triage workflow for a new red

1. Is the test wrong? Check the trace and the observation row first (`summarize-findings`).
2. Reproduce it twice (`--repeat-each=2`) and, for money bugs, once through the API.
3. Write a `## BUG-0xx` section in `docs/BUG-REPORTS.md` (template: `docs/bug-report-template.md`): steps, expected, actual, frequency, impact, severity and priority.
4. Register the exact test title in `data/known-defects.ts`. Two guard tests enforce this: every defect needs a report (`bug-docs-consistency`), every spec must import a tracking fixture (`tracking-wiring`).

## Debugging

- `npx playwright test <file> --headed --debug` steps through with the inspector.
- `npx playwright test --ui` is the time-travel runner.
- Traces keep a DOM snapshot before and after every action; the failing step is the first red one, and the error text names the locator.

## CI

`.github/workflows/playwright.yml` (GitHub Actions) and `.gitlab-ci.yml` (GitLab CI) run the same stages: typecheck and unit, the full chromium suite, cross-browser smoke (Firefox, WebKit, Pixel 7), and visual regression. Reports (HTML, JUnit, `findings/observations.jsonl`) are kept as artifacts. Runs are serialized because the demo is shared. Nightly runs catch the demo changing under us.

## Visual regression

Baselines are per operating system. Generate them where the comparison will run: locally for local runs, and in CI with the manual workflow input `update_snapshots` (downloads a `visual-baselines` artifact; commit its images). The visual job is advisory until Linux baselines are committed.

## Cross-browser notes

Only `@smoke` tests run in Firefox, WebKit and the mobile viewport. ParaBank is not responsive, so mobile findings are about layout and tap targets, not a separate mobile app.
