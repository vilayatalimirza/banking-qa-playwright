export interface KnownDefect {
  id: string;
  summary: string;
  /** 'confirmed' = reproduced and written up; 'to-confirm' = behaviour the product owner must rule on. */
  status: 'confirmed' | 'to-confirm';
}

/**
 * Open defects, keyed by the EXACT test title. Full write-ups: docs/BUG-REPORTS.md.
 *
 * A listed test is marked "expected to fail" while the bug is open, so the suite stays green.
 * When the bug is fixed the test passes, Playwright reports an UNEXPECTED PASS (a failure),
 * and that is your signal to delete the entry here.
 */
export const KNOWN_DEFECTS: Record<string, KnownDefect> = {
  'bill pay amount: negative amount': {
    id: 'BUG-001',
    summary: 'Bill Pay accepts a negative amount and credits the account',
    status: 'confirmed',
  },
  'transfer amount: negative dollar': {
    id: 'BUG-002',
    summary: 'Transfer accepts a negative amount and reverses its direction',
    status: 'confirmed',
  },
  'transfer amount: negative minimum unit': {
    id: 'BUG-002',
    summary: 'Transfer accepts a negative amount and reverses its direction',
    status: 'confirmed',
  },
  'transfer amount: one cent above balance': {
    id: 'BUG-003',
    summary: 'No available-funds check: transfers can overdraw the account without limit',
    status: 'confirmed',
  },
  'transfer amount: one hundred times the balance': {
    id: 'BUG-003',
    summary: 'No available-funds check: transfers can overdraw the account without limit',
    status: 'confirmed',
  },
  'bill pay amount: one cent above balance': {
    id: 'BUG-003',
    summary: 'No available-funds check: bill payments can overdraw the account without limit',
    status: 'confirmed',
  },
  'two simultaneous transfers cannot overdraw one account': {
    id: 'BUG-003',
    summary: 'Same root cause as BUG-003 (no funds check); keep as the race regression guard',
    status: 'confirmed',
  },
  'double-clicking Transfer applies the transfer exactly once': {
    id: 'BUG-004',
    summary: 'Double submit repeats the action (transfer applied twice)',
    status: 'confirmed',
  },
  'double-clicking Send Payment pays the bill exactly once': {
    id: 'BUG-004',
    summary: 'Double submit repeats the action (bill paid twice)',
    status: 'confirmed',
  },
  'double-clicking Open New Account creates exactly one account': {
    id: 'BUG-004',
    summary: 'Double submit repeats the action (two accounts created)',
    status: 'confirmed',
  },
  'transfer amount: scientific notation': {
    id: 'BUG-005',
    summary: 'Scientific-notation amount "1e2" is accepted and applied as $100.00',
    status: 'confirmed',
  },
  'transfer amount: zero': {
    id: 'BUG-008',
    summary: 'A zero-value transfer is accepted and recorded on the statement',
    status: 'confirmed',
  },
  'transfer amount: zero with decimals': {
    id: 'BUG-008',
    summary: 'A zero-value transfer is accepted and recorded on the statement',
    status: 'confirmed',
  },
  'transfer amount: sub-cent precision': {
    id: 'BUG-007',
    summary: 'Sub-cent amount (10.999) is accepted and then the account can no longer be read',
    status: 'confirmed',
  },
  'bill pay amount: sub-cent precision': {
    id: 'BUG-007',
    summary: 'Sub-cent amount (10.999) is accepted and then the account can no longer be read',
    status: 'confirmed',
  },
  'API rejects a negative transfer amount (BUG-002 at API level)': {
    id: 'BUG-002',
    summary: 'Same defect through the API: HTTP 200, source moved -100 cents',
    status: 'confirmed',
  },
  'API rejects a negative bill payment (BUG-001 at API level)': {
    id: 'BUG-001',
    summary: 'Same defect through the API: HTTP 200, account credited 2500 cents',
    status: 'confirmed',
  },
  'probe: sub-cent transfer amount at API level (BUG-007)': {
    id: 'BUG-007',
    summary: 'API accepts 10.999 (HTTP 200) and the account can then no longer be read',
    status: 'confirmed',
  },
  "an anonymous API call cannot move money out of another customer's account": {
    id: 'BUG-009',
    summary: 'Unauthenticated API transfer debits another customer (HTTP 200)',
    status: 'confirmed',
  },
  "another customer's account data is not readable anonymously": {
    id: 'BUG-010',
    summary: 'Account details are readable without authentication (HTTP 200)',
    status: 'confirmed',
  },
  'replaying the identical transfer request must not apply it twice': {
    id: 'BUG-004',
    summary: 'Server has no duplicate protection: an identical replayed request is applied again',
    status: 'confirmed',
  },
  'response lost after the bank applied the transfer: a retry must not double charge': {
    id: 'BUG-004',
    summary: 'After a lost response the retry charges twice (no duplicate detection)',
    status: 'confirmed',
  },
  'probe: scientific-notation amount at API level (BUG-005)': {
    id: 'BUG-005',
    summary: 'API accepts 1e2 (HTTP 200) and moves $100.00 within 2 s',
    status: 'confirmed',
  },
  'repeated wrong passwords lead to a lockout or throttle': {
    id: 'BUG-012',
    summary: 'No brute-force protection: 10 wrong passwords, then the correct one still logs in',
    status: 'confirmed',
  },
  'registration refuses a trivially weak password': {
    id: 'BUG-013',
    summary: 'A one-character password is accepted at registration',
    status: 'confirmed',
  },
  'the login page sends the standard security headers': {
    id: 'BUG-014',
    summary: 'Missing X-Frame-Options/CSP frame-ancestors, Content-Security-Policy, HSTS and Referrer-Policy',
    status: 'confirmed',
  },
  'the session cookie carries the protective flags': {
    id: 'BUG-015',
    summary: 'The JSESSIONID cookie is not marked Secure',
    status: 'confirmed',
  },
  'signed-in pages are not cacheable': {
    id: 'BUG-016',
    summary: 'Signed-in pages send no Cache-Control header',
    status: 'confirmed',
  },
  'the admin console is not reachable by an anonymous visitor': {
    id: 'BUG-017',
    summary: 'admin.htm shows administration content to an anonymous visitor',
    status: 'confirmed',
  },
  'logging in issues a new session id (no session fixation)': {
    id: 'BUG-018',
    summary: 'The session id is the same before and after login (session fixation)',
    status: 'confirmed',
  },
  "a customer cannot open another customer's account page by URL": {
    id: 'BUG-019',
    summary: "Customer A gets the Account Details page for customer B's account id",
    status: 'to-confirm',
  },
  'accessibility: index.htm has no serious violations': {
    id: 'BUG-021',
    summary:
      'Serious or critical WCAG 2.x A/AA violations on every page (unlabelled fields, missing alt text, link names, contrast, page language)',
    status: 'confirmed',
  },
  'accessibility: register.htm has no serious violations': {
    id: 'BUG-021',
    summary:
      'Serious or critical WCAG 2.x A/AA violations on every page (unlabelled fields, missing alt text, link names, contrast, page language)',
    status: 'confirmed',
  },
  'accessibility: about.htm has no serious violations': {
    id: 'BUG-021',
    summary:
      'Serious or critical WCAG 2.x A/AA violations on every page (unlabelled fields, missing alt text, link names, contrast, page language)',
    status: 'confirmed',
  },
  'accessibility: contact.htm has no serious violations': {
    id: 'BUG-021',
    summary:
      'Serious or critical WCAG 2.x A/AA violations on every page (unlabelled fields, missing alt text, link names, contrast, page language)',
    status: 'confirmed',
  },
  'accessibility: signed-in pages have no serious violations': {
    id: 'BUG-021',
    summary:
      'Serious or critical WCAG 2.x A/AA violations on every page (unlabelled fields, missing alt text, link names, contrast, page language)',
    status: 'confirmed',
  },
  'transferring from an account to itself is refused and leaves no trace': {
    id: 'BUG-006',
    summary: 'Self-transfer is accepted and recorded on the statement',
    status: 'to-confirm',
  },
};
