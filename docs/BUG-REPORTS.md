# Bug reports: ParaBank (Stage 5 findings)

Environment: https://parabank.parasoft.com/parabank/ , Chromium via Playwright, one run of the Package B suite (frequency 1 of 1 unless stated).
Oracle: invariants (must always hold) and requirements (expected bank behaviour). Requirements assume a standard retail account with no overdraft product.
Open defects are tracked in `data/known-defects.ts`; each test is marked "expected to fail" until fixed.

| ID | Title | Severity | Priority | Status |
|----|-------|----------|----------|--------|
| BUG-001 | Bill Pay accepts a negative amount and credits the account | Critical | P1 | Confirmed |
| BUG-002 | Transfer accepts a negative amount and reverses direction | High | P1 | Confirmed |
| BUG-003 | No available-funds check on transfers and bill payments | High | P1 | Confirmed (assumes no overdraft product) |
| BUG-004 | Double submit repeats transfer, bill payment and account creation | High | P1 | Confirmed |
| BUG-005 | Scientific notation "1e2" is accepted and applied as $100.00 | Medium | P2 | Confirmed (UI/ledger mismatch seen once, unconfirmed) |
| BUG-006 | Self-transfer is accepted and recorded | Low | P3 | To confirm with product owner |
| BUG-007 | Sub-cent amount (10.999) is accepted and the account can then no longer be read | High | P2 | Confirmed (exact failure mode pending next run) |
| BUG-008 | Zero-value transfer is accepted and recorded | Low | P3 | Confirmed |
| BUG-009 | Unauthenticated API call moves money out of another customer's account | Critical | P1 | Confirmed |
| BUG-010 | Account details readable without authentication | High | P1 | Confirmed |
| BUG-011 | Login API takes username and password in the URL path | Medium | P2 | Confirmed (observed in use) |

---

## BUG-001: Bill Pay accepts a negative amount and credits the account
**Severity:** Critical. **Priority:** P1. **Frequency:** 1 of 1.

**Steps**
1. Register a customer; note the balance of the checking account.
2. Open Bill Pay, fill a valid payee, amount `-25.00`, choose the account, click Send Payment.
3. Open Accounts Overview.

**Expected:** the amount is rejected; balance unchanged.
**Actual:** the account moved by -2500 cents, i.e. it was credited $25.00. The bank total rose, so money was created.
**Impact:** an external payment path can mint money. Direct financial loss, fraud vector.
**Suspected layer:** server-side validation (no sign check); the UI does not block it either.
**Test:** `bill pay amount: negative amount`.

## BUG-002: Transfer accepts a negative amount and reverses direction
**Severity:** High. **Priority:** P1. **Frequency:** 1 of 1 per input.

**Steps:** Transfer `-1.00` (and separately `-0.01`) from account A to B; compare balances.
**Expected:** rejected, nothing moves.
**Actual:** `-1.00` moved -100 cents and `-0.01` moved -1 cent from the source: money flows from B to A.
**Impact:** whether this lets a user pull funds from another customer's account is NOT tested here; check at API level in Package C.
**Suspected layer:** server-side validation.
**Tests:** `transfer amount: negative dollar`, `transfer amount: negative minimum unit`.

## BUG-003: No available-funds check
**Severity:** High. **Priority:** P1. **Frequency:** 1 of 1 per input.
**Assumption:** the product has no overdraft facility. If it does, this becomes "no overdraft limit".

**Actual (from the run)**
- Transfer of balance + 1 cent (balance $415.50) moved 41551 cents.
- Transfer of 100x the balance moved 4,155,000 cents.
- Bill pay of balance + 1 cent (balance $515.50) moved 51551 cents.
- Race: two 24930-cent transfers both applied (moved 49860); the source ended at -8310 cents.
**Expected:** amount above the available balance is refused.
**Impact:** unlimited overdraft; the race result is the same root cause, kept as a regression guard for the concurrency fix.
**Tests:** `transfer amount: one cent above balance`, `transfer amount: one hundred times the balance`, `bill pay amount: one cent above balance`, `two simultaneous transfers cannot overdraw one account`.

## BUG-004: Double submit repeats the action
**Severity:** High. **Priority:** P1. **Frequency:** 1 of 1 for each flow.

**Steps:** fill the form, double-click the submit button.
**Actual**
- Transfer: intended 777 cents, moved 1554, two debit rows on the statement.
- Bill pay: intended 1111 cents, moved 2222.
- Open New Account: three accounts exist afterwards (one intended).
**Expected:** one intent applies once (idempotency enforced server-side; a disabled button is only a convenience).
**Impact:** duplicate payments and duplicate accounts from one impatient click or a retry.
**Tests:** the three `double-clicking ...` tests in `tests/negative/idempotency.spec.ts`.

**API level (Package C):** replaying a byte-identical transfer request applied it twice (intended 500 cents, moved 1000).
**Lost response:** when the bank applied a transfer but the answer never reached the page, the user's retry charged twice (intended 1000, moved 2000). Root cause is the same: no idempotency key or duplicate detection on the server.
**Tests (added):** `replaying the identical transfer request must not apply it twice`, `response lost after the bank applied the transfer: a retry must not double charge`.

## BUG-005: Scientific notation "1e2" is accepted and applied
**Severity:** Medium. **Priority:** P2.
**Frequency:** accepted and applied in 4 of 4 checks that read the result reliably: UI runs earlier (moved 10000), and the API probe (HTTP 200, moved 10000 within 2 s, statement and balance consistent).
**Expected:** rejected as not a money format.
**Actual:** `1e2` is parsed as 100 and $100.00 moves.
**Impact:** ambiguous input parsing; a typo like `1e5` becomes a $100,000 transfer.
**Unconfirmed observation:** in one batch of 5 UI repeats (10 Nov, 12:54) the page said "Transfer Complete! $100.00 has been transferred" while both balances read unchanged. The API probe 11 minutes later did not reproduce it, and the demo database appeared to have been reset in between (account numbers dropped from about 33k to about 17k), so a stale read after the reset is the likely cause. The UI test now has an invariant ("a success confirmation means the money actually moved") that records it if it recurs.
**Tests:** `transfer amount: scientific notation`, `probe: scientific-notation amount at API level (BUG-005)`.

## BUG-006: Self-transfer recorded (to confirm)
**Severity:** Low. **Priority:** P3. **Frequency:** 1 of 1.
**Actual:** transfer from an account to itself for $10.00 is accepted and appears as two statement rows for $10.00.
**Question for the product owner:** should same-account transfers be refused? If allowed by design, delete the test or flip the requirement.
**Test:** `transferring from an account to itself is refused and leaves no trace`.

## BUG-007: Sub-cent amount is accepted and the account can no longer be read
**Severity:** High. **Priority:** P2. **Frequency:** 1 of 1 at API level; 4 of 4 through the UI (two runs).

**Steps:** POST a transfer of `10.999` from account A to B (API or UI), then read account A / open Accounts Overview.
**Expected:** the amount is refused (or exactly rounded to a cent), and the account stays readable.
**Actual:** the API answers `HTTP 200 "Successfully transferred $10.999 from account #33657 to account #33768"`. Afterwards the source account could not be read back as a numeric balance and the Accounts Overview did not load (in the UI tests the browser ended on its own error page).
**Impact:** one malformed amount makes a customer's account view unusable. Combined with BUG-009 (no authentication) anyone could do this to any account.
**Still unknown:** the exact failure (HTTP status and body of the account read). The probe now records `readStatusAfter` and `readBodyAfter`; read them from `npx tsx scripts/summarize-findings.ts` after the next run and add them here.
**Tests:** `probe: sub-cent transfer amount at API level (BUG-007)`, `transfer amount: sub-cent precision`, `bill pay amount: sub-cent precision`.

## BUG-008: Zero-value transfer is accepted and recorded
**Severity:** Low. **Priority:** P3. **Frequency:** 1 of 1 for `0` and for `0.00`.
**Actual:** the source account's statement gets a zero-value row after a $0 transfer (balances unchanged, which is why the old check could not see it).
**Expected:** rejected; nothing recorded.
**Impact:** noise in statements, a way to generate fake activity, audit clutter.
**Tests:** `transfer amount: zero`, `transfer amount: zero with decimals`.

## BUG-009: Unauthenticated API call moves money out of another customer's account
**Severity:** Critical. **Priority:** P1. **Frequency:** 1 of 1.

**Steps** (both customers created by the test run)
1. Customer B owns an account. Make a transfer request from B's account to customer A's account with an HTTP client that has NO session cookie.
**Expected:** 401 or 403; B's balance unchanged.
**Actual:** HTTP 200 and B lost 100 cents.
**Impact:** anyone who can guess or enumerate an account number can drain it; the API performs no authentication or ownership check. Fraud and total-loss risk.
**Suspected layer:** API authentication and authorization (broken access control).
**Test:** `an anonymous API call cannot move money out of another customer's account`.

## BUG-010: Account details readable without authentication
**Severity:** High. **Priority:** P1. **Frequency:** 1 of 1.
**Actual:** an anonymous GET of another customer's account returned HTTP 200 with the balance.
**Expected:** 401 or 403.
**Impact:** balance disclosure for any account id; makes BUG-009 easy to exploit.
**Test:** `another customer's account data is not readable anonymously`.

## BUG-011: Login API takes credentials in the URL path
**Severity:** Medium. **Priority:** P2. **Frequency:** every use.
**Actual:** the working login call is `GET services/bank/login/{username}/{password}`.
**Impact:** credentials end up in server logs, proxy logs and browser history; GET requests can be cached or replayed.
**Expected:** credentials in a POST body (or a token flow), never in the URL.
**Evidence:** every API test logs in this way successfully. There is no dedicated test; add one in Package D if you want it tracked.

---

## Behaviours confirmed correct
- API: a wrong password is refused; account and login responses match the expected shape; API and UI always agree on balances and statements.
- API: a transfer to or from a non-existent account is refused and no money is destroyed; a missing amount is refused.
- Resilience: a cut connection, offline mode and a server 500 each leave balances untouched and the UI shows no false success; a slow server (3 s) still applies a single click exactly once.
- Non-numeric, empty, whitespace-only, `1 OR 1=1` and huge amounts are refused with no balance change.
- One cent below the balance and exactly the balance are accepted and move exactly that amount.
- SQL-injection login payloads (`' OR '1'='1`, `admin'--`) did not authenticate.
- XSS payee payloads neither executed nor rendered as HTML.

## Caveat
The zero-amount tests originally could not tell accept from reject (balances are unchanged either way). They now also check the statement for a zero-value row, which is how BUG-008 was found.
Because BUG-007 tests crash at navigation rather than at an assertion, an expected-fail mark would also hide other failures in those two tests; the API probe in Package C replaces them with a precise check.
