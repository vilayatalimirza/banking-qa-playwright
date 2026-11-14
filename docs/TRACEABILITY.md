# Requirements traceability matrix

Requirements live in `data/requirements.ts`. Regenerate with `npx tsx scripts/traceability.ts`.

Generated 2026-11-14 (results of test-results/results.json). Sorted by risk score = impact x likelihood.

| Req | Requirement | Area | Risk (I x L) | Tier | Tests | Passed | Open defects | Result |
|---|---|---|---|---|---|---|---|---|
| REQ-002 | Transfer amounts are validated (negative, zero, sub-cent, non-numeric, scientific, overflow, missing) | Payments | 5 x 4 = 20 | Critical | 23 | 11 | BUG-002, BUG-003, BUG-005, BUG-007, BUG-008 | FAILING |
| REQ-003 | A payment or transfer cannot exceed the available funds (no overdraft, no race to overdraw) | Payments | 5 x 4 = 20 | Critical | 4 | 0 | BUG-003, BUG-006 | DEFECT OPEN |
| REQ-005 | One user intent is applied once (idempotency against double clicks, replays and retries) | Payments | 5 x 4 = 20 | Critical | 5 | 0 | BUG-004 | DEFECT OPEN |
| REQ-011 | Authorization: no access to protected pages or other customers data without permission | Security | 5 x 4 = 20 | Critical | 12 | 7 | BUG-009, BUG-010, BUG-017, BUG-019 | FAILING |
| REQ-023 | Strong customer authentication for electronic payments (PSD2 SCA) | Compliance | 4 x 5 = 20 | Critical | 1 | 0 | GAP-001 | DEFECT OPEN |
| REQ-012 | Credential protection (brute force, weak passwords, user enumeration) | Security | 4 x 4 = 16 | Critical | 3 | 1 | BUG-012, BUG-013 | DEFECT OPEN |
| REQ-024 | KYC data is validated at onboarding | Compliance | 4 x 4 = 16 | Critical | 1 | 0 | GAP-002 | FAILING |
| REQ-001 | An internal transfer moves exactly the requested amount and conserves the bank total | Payments | 5 x 3 = 15 | Critical | 4 | 4 | - | VERIFIED |
| REQ-004 | A bill payment debits exactly the amount and rejects invalid amounts | Payments | 5 x 3 = 15 | Critical | 9 | 4 | BUG-001, BUG-003, BUG-007 | FAILING |
| REQ-006 | Concurrent requests cannot corrupt balances | Payments | 5 x 3 = 15 | Critical | 1 | 0 | BUG-003 | DEFECT OPEN |
| REQ-008 | Balances, statements and the API agree (reconciliation) | Ledger | 5 x 3 = 15 | Critical | 6 | 4 | - | FAILING |
| REQ-009 | Network failures never leave balances inconsistent or show a false success | Resilience | 5 x 3 = 15 | Critical | 5 | 4 | BUG-004 | DEFECT OPEN |
| REQ-010 | Authentication and session management (login, logout, session replay, fixation, cookie flags) | Security | 5 x 3 = 15 | Critical | 14 | 11 | BUG-018, BUG-019 | FAILING |
| REQ-007 | Opening an account moves money without creating or destroying any | Accounts | 4 x 3 = 12 | Standard | 1 | 0 | - | FAILING |
| REQ-013 | Response hardening (security headers, caching, exposed admin console) | Security | 3 x 4 = 12 | Standard | 4 | 0 | BUG-014, BUG-015, BUG-016, BUG-017 | DEFECT OPEN |
| REQ-015 | Accessibility: WCAG 2.1 A and AA (screen readers, keyboard, contrast) | Quality | 3 x 4 = 12 | Standard | 6 | 1 | BUG-021 | DEFECT OPEN |
| REQ-022 | Audit trail: the statement is append-only and every entry says what, how much and when | Compliance | 4 x 3 = 12 | Standard | 2 | 1 | - | FAILING |
| REQ-014 | Input injection resistance (SQL injection, cross-site scripting) | Security | 5 x 2 = 10 | Standard | 4 | 4 | - | VERIFIED |
| REQ-019 | Money maths is exact: integer cents, parsing, rounding and formatting | Foundations | 5 x 2 = 10 | Standard | 43 | 43 | - | VERIFIED |
| REQ-021 | Double-entry ledger: every transfer is a balanced debit and credit | Compliance | 5 x 2 = 10 | Standard | 1 | 1 | - | VERIFIED |
| REQ-016 | Key forms keep their layout (visual regression) | Quality | 2 x 3 = 6 | Low | 6 | 0 | - | NOT RUN |
| REQ-017 | Critical journeys work in Chromium, Firefox, WebKit and a phone viewport | Quality | 3 x 2 = 6 | Low | 5 | 1 | - | FAILING |
| REQ-018 | Customer self-service: profile update, loans and transaction search | Accounts | 3 x 2 = 6 | Low | 4 | 0 | - | FAILING |
| REQ-020 | The test framework itself is trustworthy (page contracts, helper and wiring self-checks) | Foundations | 2 x 2 = 4 | Low | 69 | 62 | - | FAILING |

Tests by tier (a test covering several requirements is counted once per requirement): Critical 88, Standard 61, Low 84.

Tests not mapped to any requirement: 0
