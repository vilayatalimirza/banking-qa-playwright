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
| BUG-012 | No brute-force protection on login | High | P2 | Confirmed |
| BUG-013 | One-character password accepted at registration | Medium | P2 | Confirmed |
| BUG-014 | Missing security headers (clickjacking, CSP, HSTS, Referrer-Policy) | Medium | P3 | Confirmed |
| BUG-015 | Session cookie not marked Secure | Medium | P2 | Confirmed |
| BUG-016 | Signed-in pages send no Cache-Control | Low | P3 | Confirmed |
| BUG-017 | Admin console reachable by an anonymous visitor | Critical | P1 | Confirmed (page only looked at, never used) |
| BUG-018 | Session id unchanged at login (session fixation) | Medium | P2 | Confirmed |
| BUG-019 | Customer A can open customer B's account details page by URL | Critical | P1 | To confirm (oracle strengthened) |
| BUG-020 | Anonymous visits to protected pages answer "An internal error has occurred" | Low | P3 | Observed |
| BUG-021 | Serious/critical WCAG 2.x A/AA accessibility violations on every page | High | P2 | Confirmed (automated axe-core scan) |

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

## BUG-012: No brute-force protection on login
**Severity:** High. **Priority:** P2. **Frequency:** 1 of 1.
**Steps:** send 10 wrong passwords for one customer, then the correct password (API login; account created by the test).
**Actual:** all 10 answered HTTP 400 with no lockout, no 429 and no slowdown (619 ms first, 375 ms last); the correct password then logged in (HTTP 200).
**Expected:** throttling or temporary lockout after repeated failures.
**Impact:** unlimited password guessing and credential stuffing.
**Test:** `repeated wrong passwords lead to a lockout or throttle`.

## BUG-013: Weak password accepted
**Severity:** Medium. **Priority:** P2. **Frequency:** 1 of 1.
**Actual:** an account registered with the password `1` can log in.
**Expected:** a minimum length and complexity policy.
**Test:** `registration refuses a trivially weak password`.

## BUG-014: Missing security headers
**Severity:** Medium. **Priority:** P3. **Frequency:** 1 of 1.
**Actual (login page):** `X-Content-Type-Options: nosniff` is present. Missing: X-Frame-Options or CSP `frame-ancestors`, Content-Security-Policy, Strict-Transport-Security, Referrer-Policy. Server header: `cloudflare` (the edge may be where these should be added).
**Impact:** clickjacking, no HTTPS pinning, no script-source restrictions, URL leakage in referrers.
**Test:** `the login page sends the standard security headers`.

## BUG-015: Session cookie not Secure
**Severity:** Medium. **Priority:** P2. **Frequency:** 1 of 1.
**Actual:** `JSESSIONID` is HttpOnly and SameSite=Lax (good) but `secure: false`.
**Expected:** Secure, so the cookie is never sent over plain HTTP.
**Test:** `the session cookie carries the protective flags`.

## BUG-016: Signed-in pages are cacheable
**Severity:** Low. **Priority:** P3. **Frequency:** 1 of 1.
**Actual:** the Overview response has no `Cache-Control` header.
**Expected:** `no-store` for account pages. Mitigated in practice: the Back-button-after-logout test found no account rows.
**Test:** `signed-in pages are not cacheable`.

## BUG-017: Admin console reachable anonymously
**Severity:** Critical. **Priority:** P1. **Frequency:** 1 of 1.
**Actual:** `admin.htm` shows its administration content (page text matched "Administration", "Data Access Mode", "Initialize") to a visitor with no login. The test only looks at the page; its buttons were never clicked.
**Impact:** anyone can reach functions that reset or reconfigure the application, including the shared demo database. This plausibly explains why account numbers dropped from about 33k to about 17k between runs (a reset by someone else); that link is a hypothesis, not proven.
**Test:** `the admin console is not reachable by an anonymous visitor`.

## BUG-018: Session fixation
**Severity:** Medium. **Priority:** P2. **Frequency:** 1 of 1.
**Actual:** `JSESSIONID` had the same value before and after login.
**Expected:** a new session id at login.
**Impact:** an attacker who plants a known session id in a victim's browser can use it after the victim logs in.
**Test:** `logging in issues a new session id (no session fixation)`.

## BUG-019: Customer A can open customer B's account page (to confirm)
**Severity:** Critical. **Priority:** P1. **Frequency:** 1 of 1 (heading level).
**Actual:** customer A requested `activity.htm?id=<B's account>` and got the "Account Details" page. The first oracle only looked for the heading, which loads before the data, so it did not prove B's data was shown.
**Why it is probably real:** the API returns any account to anyone (BUG-010).
**Next:** the test now looks for B's account number in the page (with a control proving the same detection works for A's own account).
**Test:** `a customer cannot open another customer's account page by URL`.

## BUG-020: Anonymous visits to protected pages produce an internal-error page
**Severity:** Low. **Priority:** P3.
**Actual:** opening any protected page without a session shows "Error! An internal error has occurred and has been logged." (the login form is still shown, so no data leaks).
**Expected:** a redirect to the login page. The message suggests an unhandled exception for logged-out visitors.
**Evidence:** `protected-page` rows in the findings table (7 of 7 pages).

## BUG-021: Serious and critical accessibility violations on every page
**Severity:** High. **Priority:** P2. **Frequency:** 11 of 11 pages scanned (axe-core, WCAG 2.0/2.1 level A and AA, one run).
**Impact:** screen-reader and keyboard users cannot reliably complete forms (transfer, bill pay, registration); low-contrast text is hard to read; regulators and customers expect WCAG 2.1 AA from consumer banking services.
**Caveat:** an automated scan finds only part of the real problems; this is a floor. Passing the scan would not prove the site is accessible.

Four distinct problems (axe rule ids), with elements affected per page:

| Page | label (critical) | select-name (critical) | image-alt (critical) | link-name | color-contrast | html-has-lang |
|---|---|---|---|---|---|---|
| index.htm (login) | 2 | | 1 | 1 | 6 | 1 |
| register.htm | 13 | | 1 | 1 | 14 | 1 |
| about.htm | 2 | | 1 | 1 | 3 | 1 |
| contact.htm | 6 | | 1 | 1 | 7 | 1 |
| overview.htm | | | 1 | 1 | 4 | 1 |
| openaccount.htm | | 2 | 1 | 1 | 3 | 1 |
| transfer.htm | 1 | 2 | 1 | 1 | 3 | 1 |
| billpay.htm | 9 | 1 | 1 | 1 | 13 | 1 |
| findtrans.htm | 5 | 1 | 1 | 1 | 3 | 1 |
| updateprofile.htm | 7 | | 1 | 1 | 10 | 1 |
| requestloan.htm | 2 | 1 | 1 | 1 | 6 | 1 |

1. **Form fields without accessible names** (`label`, `select-name`; WCAG 1.3.1, 4.1.2, level A): inputs and dropdowns are not associated with their visible labels. Matches what the page objects already had to work around (login inputs are found by `name` attribute).
2. **Image without alternative text and link without a name** (`image-alt`, `link-name`; WCAG 1.1.1, 2.4.4, level A): one image and one link on every page, probably the header logo.
3. **Insufficient colour contrast** (`color-contrast`; WCAG 1.4.3, level AA): 3 to 14 elements per page.
4. **No page language** (`html-has-lang`; WCAG 3.1.1, level A): the `<html>` element has no `lang` attribute.

**Tests:** `accessibility: <page> has no serious violations` for index, register, about and contact, and `accessibility: signed-in pages have no serious violations` (7 pages).
**Not affected:** the keyboard-only login test passes (username, Tab, password, Enter logs in).

---

## Behaviours confirmed correct
- Accessibility: the login form can be completed with the keyboard alone.
- Visual: the 6 layout baselines (login, registration, transfer, bill pay, open account, overview) compare identically on a second run, so the masks hide everything dynamic.
- Cross-browser: the 5 smoke journeys (auth, overview, open account, transfer, bill pay) pass in Firefox, WebKit and a Pixel 7 viewport.
- Security: login credentials travel in a POST body and never appear in a URL; logout kills the session on the server; a stolen session cookie replayed after logout is dead; the Back button after logout shows no account data; protected pages never show the signed-in UI to an anonymous visitor.
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

## GAP-001: No strong customer authentication (PSD2 SCA) on remote payments
**Severity:** Medium (demo system; High for a real EU bank). **Priority:** P3. **Type:** compliance gap, not a coding defect.
**Steps:** register, call `POST billpay` for $100.00 with only the existing identity. **Actual:** the payment completes; no one-time code, push approval or other second factor is requested. **Expected:** under PSD2 a remote electronic payment above the exemption thresholds needs two of knowledge/possession/inherence (SCA), with dynamic linking of amount and payee.
**Test:** `PSD2 SCA: a payment above the exemption limit needs a second factor` (tracked, expected to fail until a challenge exists).

## GAP-002: Registration accepts an invalid SSN (no KYC data validation)
**Severity:** Medium (demo system; High for a real bank). **Priority:** P3. **Type:** compliance gap. **Reproduced:** 1 of 1 run.
**Steps:** open Register, fill the form with SSN `abc`, submit. **Actual:** the customer is created and logged in. **Expected:** identity fields are validated (format at minimum) before an account exists; real KYC/CDD also verifies identity against documents or a registry.
**Test:** `KYC: registration refuses an obviously invalid SSN` (tracked, expected to fail until validation exists).
