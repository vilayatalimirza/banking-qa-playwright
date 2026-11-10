import { buildPayee } from '../../data/factories';
import { test } from '../../fixtures/api';
import { Checks } from '../../utils/checks';
import { observe } from '../../utils/findings';

// Request tampering at API level. These only ever touch accounts created by THIS test run
// (the customer and, for cross-customer checks, the secondUser fixture), never anyone else's data.

test('API rejects a negative transfer amount (BUG-002 at API level)', { tag: ['@api', '@negative'] }, async ({ api, session }) => {
  const savings = await api.createAccount(session.customerId, 'SAVINGS', session.sourceId);
  const before = await api.balanceCents(session.sourceId);

  const result = await api.transfer(session.sourceId, savings.id, '-1.00');
  const moved = before - (await api.balanceCents(session.sourceId));

  const checks = new Checks();
  checks.check('INVARIANT', 'a transfer never pulls money into the source', moved >= 0, `source moved ${moved}`);
  checks.check('REQUIREMENT', 'a negative amount is refused', result.status >= 400 && moved === 0, `HTTP ${result.status}, moved ${moved}`);
  observe('api-negative-transfer', { status: result.status, movedCents: moved, verdict: checks.verdict });
});

test('API rejects a negative bill payment (BUG-001 at API level)', { tag: ['@api', '@negative'] }, async ({ api, session }) => {
  const before = await api.balanceCents(session.sourceId);

  const result = await api.billPay(session.sourceId, '-25.00', buildPayee());
  const moved = before - (await api.balanceCents(session.sourceId));

  const checks = new Checks();
  checks.check('INVARIANT', 'a payment never credits the payer', moved >= 0, `account moved ${moved}`);
  checks.check('REQUIREMENT', 'a negative payment is refused', result.status >= 400 && moved === 0, `HTTP ${result.status}, moved ${moved}`);
  observe('api-negative-billpay', { status: result.status, movedCents: moved, verdict: checks.verdict });
});

// BUG-007 probe: what does the SERVER do with a sub-cent amount, and does the customer still work afterwards?
test('probe: sub-cent transfer amount at API level (BUG-007)', { tag: ['@api', '@negative'] }, async ({ api, session, pages }) => {
  const savings = await api.createAccount(session.customerId, 'SAVINGS', session.sourceId);
  const before = await api.rawBalance(session.sourceId);

  const result = await api.transfer(session.sourceId, savings.id, '10.999');

  // Read the account again and keep the raw answer: status and body show HOW it is broken, if it is.
  const readAfter = await api.getAccountRaw(session.sourceId);
  const rawAfter = Number((readAfter.json as Record<string, unknown> | null)?.balance);
  const apiStillWorks = Number.isFinite(rawAfter);
  const centsFraction = Math.abs(rawAfter * 100 - Math.round(rawAfter * 100));

  // Does the page still work after that request? This is exactly where the UI test hit a browser error page.
  let overviewLoads = true;
  try {
    await pages.overview.open();
  } catch {
    overviewLoads = false;
  }

  const checks = new Checks();
  checks.check('REQUIREMENT', 'a sub-cent amount is refused', result.status >= 400, `HTTP ${result.status} ${result.text.slice(0, 80)}`);
  checks.check('INVARIANT', 'a stored balance never holds fractions of a cent', apiStillWorks && centsFraction < 1e-6, `raw balance ${before} -> ${rawAfter}`);
  checks.check('INVARIANT', 'the customer can still use the app afterwards', overviewLoads, overviewLoads ? 'overview loaded' : 'overview did not load');
  observe('api-subcent', {
    status: result.status,
    body: result.text.slice(0, 120),
    rawBalanceBefore: before,
    rawBalanceAfter: rawAfter,
    apiStillWorks,
    readStatusAfter: readAfter.status,
    readBodyAfter: readAfter.text.slice(0, 160),
    overviewLoads,
    verdict: checks.verdict,
  });
});

test('an anonymous API call cannot move money out of another customer\'s account', { tag: ['@api', '@security'] }, async ({ api, session, secondUser }) => {
  // Owner B is a second customer we registered; "api" carries no session cookie at all.
  const ownerBId = await api.customerIdFor(secondUser.customer.username, secondUser.customer.password);
  const ownerBAccount = (await api.accountsOf(ownerBId))[0];
  if (!ownerBAccount) {
    throw new Error('second customer has no account');
  }
  const bBefore = await api.balanceCents(ownerBAccount.id);

  const result = await api.transfer(ownerBAccount.id, session.sourceId, '1.00');
  const bLost = bBefore - (await api.balanceCents(ownerBAccount.id));

  const checks = new Checks();
  checks.check('INVARIANT', 'an unauthenticated caller can never debit someone else\'s account', bLost <= 0, `owner B lost ${bLost} cents`);
  checks.check('REQUIREMENT', 'the request is refused as unauthenticated or unauthorised', result.status === 401 || result.status === 403, `HTTP ${result.status}`);
  observe('api-cross-customer-transfer', { status: result.status, victimLostCents: bLost, verdict: checks.verdict });
});

test('another customer\'s account data is not readable anonymously', { tag: ['@api', '@security'] }, async ({ api, secondUser }) => {
  const ownerBId = await api.customerIdFor(secondUser.customer.username, secondUser.customer.password);
  const ownerBAccount = (await api.accountsOf(ownerBId))[0];
  if (!ownerBAccount) {
    throw new Error('second customer has no account');
  }

  const result = await api.getAccountRaw(ownerBAccount.id);

  const checks = new Checks();
  checks.check('REQUIREMENT', 'account details require authentication', result.status === 401 || result.status === 403, `HTTP ${result.status}`);
  observe('api-anonymous-read', { status: result.status, bodyHasBalance: result.text.includes('balance'), verdict: checks.verdict });
});
