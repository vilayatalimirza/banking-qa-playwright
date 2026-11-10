import { test } from '../../fixtures/api';
import { Checks } from '../../utils/checks';
import { observe } from '../../utils/findings';

// Probes: small experiments that record exactly what the server does, so a finding can be written precisely.

// BUG-005: the UI showed "Transfer Complete! $100.00 has been transferred" for 1e2 but balances did not move.
// Is that a stale read, a UI-only message, or does the server really answer success and do nothing?
test('probe: scientific-notation amount at API level (BUG-005)', { tag: ['@api', '@negative'] }, async ({ api, session }) => {
  const savings = await api.createAccount(session.customerId, 'SAVINGS', session.sourceId);
  const balanceBefore = await api.balanceCents(session.sourceId);
  const transactionsBefore = (await api.transactions(session.sourceId)).length;

  const result = await api.transfer(session.sourceId, savings.id, '1e2');

  const movedNow = balanceBefore - (await api.balanceCents(session.sourceId));
  await new Promise((resolve) => setTimeout(resolve, 2000)); // rule out a delayed write
  const movedLater = balanceBefore - (await api.balanceCents(session.sourceId));
  const newTransactions = (await api.transactions(session.sourceId)).length - transactionsBefore;

  const checks = new Checks();
  checks.check('REQUIREMENT', 'scientific notation is refused', result.status >= 400 && movedLater === 0, `HTTP ${result.status}, moved ${movedLater}`);
  checks.check('INVARIANT', 'a success answer means the money moved', !(result.ok && movedLater === 0), `HTTP ${result.status}, moved ${movedLater}`);
  checks.check('INVARIANT', 'the statement matches the balance (no money without a transaction, no transaction without money)', (newTransactions > 0) === (movedLater !== 0), `${newTransactions} new transactions, moved ${movedLater}`);
  observe('api-scientific', {
    status: result.status,
    body: result.text.slice(0, 120),
    movedNowCents: movedNow,
    movedAfter2sCents: movedLater,
    newTransactions,
    verdict: checks.verdict,
  });
});
