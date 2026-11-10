import { test } from '../../fixtures/api';
import { Checks } from '../../utils/checks';
import { observe } from '../../utils/findings';
import { toDecimalInput } from '../../utils/format';

// Transfers driven straight through the API: faster and more precise than the UI, and it shows what the
// SERVER enforces when the page is not there to help.

test('API transfer moves exactly the amount and keeps the bank total', { tag: ['@api'] }, async ({ api, session }) => {
  const AMOUNT = 1234; // $12.34
  const savings = await api.createAccount(session.customerId, 'SAVINGS', session.sourceId);
  const before = { source: await api.balanceCents(session.sourceId), savings: await api.balanceCents(savings.id) };

  const result = await api.transfer(session.sourceId, savings.id, toDecimalInput(AMOUNT));

  const after = { source: await api.balanceCents(session.sourceId), savings: await api.balanceCents(savings.id) };
  const checks = new Checks();
  checks.check('REQUIREMENT', 'a valid transfer succeeds', result.status === 200, `HTTP ${result.status} ${result.text.slice(0, 80)}`);
  checks.check('INVARIANT', 'the bank total is unchanged', after.source + after.savings === before.source + before.savings, `before ${before.source + before.savings}, after ${after.source + after.savings}`);
  checks.check('REQUIREMENT', 'the source loses exactly the amount', before.source - after.source === AMOUNT, `moved ${before.source - after.source}`);
  observe('api-transfer', { status: result.status, movedCents: before.source - after.source, verdict: checks.verdict });
});

test('replaying the identical transfer request must not apply it twice', { tag: ['@api', '@idempotency'] }, async ({ api, session }) => {
  const AMOUNT = 500; // $5.00
  const savings = await api.createAccount(session.customerId, 'SAVINGS', session.sourceId);
  const before = await api.balanceCents(session.sourceId);

  const first = await api.transfer(session.sourceId, savings.id, toDecimalInput(AMOUNT));
  const second = await api.transfer(session.sourceId, savings.id, toDecimalInput(AMOUNT)); // byte-for-byte replay

  const moved = before - (await api.balanceCents(session.sourceId));
  const checks = new Checks();
  checks.check('REQUIREMENT', 'a replayed request is applied once (idempotency)', moved === AMOUNT, `moved ${moved}, one request intended ${AMOUNT}`);
  observe('api-replay', { firstStatus: first.status, secondStatus: second.status, movedCents: moved, verdict: checks.verdict });
});

test('transfer from a non-existent account is refused', { tag: ['@api', '@negative'] }, async ({ api, session }) => {
  const savings = await api.createAccount(session.customerId, 'SAVINGS', session.sourceId);
  const before = await api.balanceCents(savings.id);

  const result = await api.transfer('999999999', savings.id, '5.00');
  const gained = (await api.balanceCents(savings.id)) - before;

  const checks = new Checks();
  checks.check('INVARIANT', 'money never appears from a non-existent account', gained === 0, `destination gained ${gained}`);
  checks.check('REQUIREMENT', 'the request is refused with an HTTP error', result.status >= 400, `HTTP ${result.status} ${result.text.slice(0, 80)}`);
  observe('api-bad-source', { status: result.status, gainedCents: gained, verdict: checks.verdict });
});

test('transfer to a non-existent account does not debit the source', { tag: ['@api', '@negative'] }, async ({ api, session }) => {
  const before = await api.balanceCents(session.sourceId);

  const result = await api.transfer(session.sourceId, '999999999', '5.00');
  const lost = before - (await api.balanceCents(session.sourceId));

  const checks = new Checks();
  checks.check('INVARIANT', 'money is never destroyed: no debit without a credit', lost === 0, `source lost ${lost}`);
  checks.check('REQUIREMENT', 'the request is refused with an HTTP error', result.status >= 400, `HTTP ${result.status} ${result.text.slice(0, 80)}`);
  observe('api-bad-destination', { status: result.status, lostCents: lost, verdict: checks.verdict });
});

test('transfer without an amount is refused', { tag: ['@api', '@negative'] }, async ({ api, session }) => {
  const savings = await api.createAccount(session.customerId, 'SAVINGS', session.sourceId);
  const before = await api.balanceCents(session.sourceId);

  const result = await api.transfer(session.sourceId, savings.id, '');
  const moved = before - (await api.balanceCents(session.sourceId));

  const checks = new Checks();
  checks.check('REQUIREMENT', 'a missing amount is refused', result.status >= 400 && moved === 0, `HTTP ${result.status}, moved ${moved}`);
  observe('api-missing-amount', { status: result.status, movedCents: moved, verdict: checks.verdict });
});
