# Flaky and environmental failures log

Rule: a failure is "flaky" only if re-running without code changes can change the result and the cause is understood or bounded. Anything else is a bug, in the test or in the bank.

| Date | Symptom | Cause | Action |
|---|---|---|---|
| Package B | `twoAccounts` overview showed 0 rows right after opening an account | Demo read before the new account was visible (stale read / demo DB reset) | Wait for the expected row instead of a fixed sleep; re-run clears |
| Package C | Scientific-notation transfer "succeeded" in UI with 0 moved | Stale read after a demo reset, not a bank behaviour | Settled with an API probe; the real defect is BUG-005 (accepted and applied) |
| Package C | 2 reds in triage run (not defects) | Environmental (demo slow or reset) | Re-run green |
| Package D | Enumeration test: login form missing, timeout | Demo returned an error/Cloudflare-like page | Test records page state instead of hanging; 60 s timeout |
| Package E | Offline-test overview showed 0 rows | Same stale-read pattern after the network was restored | Retry with trace; reported FLAKY, not hidden |

Standing mitigations: 1 worker in CI, retries 2 with trace on first retry, concurrency lock so two pipelines never hit the demo together, retry result shown as FLAKY in reports.

| 2026-11-11 | Full run: 45 of 209 tests failed, 1.7 h. Register link / login form missing, `ERR_ADDRESS_UNREACHABLE`, 7 contract tests red together | The demo became unreachable mid-run (all failures are setup/navigation timeouts) | Not defects. Added a pre-flight check in `global-setup.ts` so an outage stops the run in seconds; re-run the failed tests when the demo is up (`--last-failed`) |

| 2026-11-14 | Find Transactions contract and e2e failed on every run; Profile e2e failed 4 of 4 | Two different causes, found with `scripts/inspect-pages.ts`: (1) the demo renamed the field `criteria.amount` to `amount` (page drift, not flaky); (2) the profile update works but the confirmation can take longer than 5 s | Page object selector updated; confirmation wait raised to 20 s |
