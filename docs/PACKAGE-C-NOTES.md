# Package C: API, hybrid, failure simulation

Run (gentle on the shared demo):

    npx playwright test tests/unit tests/api tests/hybrid tests/resilience
    npx tsx scripts/summarize-findings.ts

## What is new
- `api/ParaBankApi.ts`: client for `services/bank/*`. Raw calls return status and body; typed helpers throw readable errors.
- `fixtures/api.ts`: `api` (no session cookie, deliberately anonymous) and `session` (UI-registered customer looked up via API).
- `tests/api`: contract (shape), transfer rules, replay/idempotency, invalid accounts, tampering, cross-customer access, the BUG-007 probe.
- `tests/hybrid`: API changes verified in the UI and UI changes verified through the API.
- `tests/resilience`: connection cut, offline, 500, slow server, response lost after the bank applied the transfer.

## How to read results
Reds here are candidate findings, same as Package B. The API endpoints are written from ParaBank's documented
REST shape; if a test fails with "API login failed: HTTP 404 ..." or "Unexpected account payload", the failure message
contains the real status and body, which is all that is needed to correct the client.

## Safety
Cross-customer tests only touch accounts created by the same test run (the customer and the `secondUser` fixture).
Do not point them at accounts you did not create.
