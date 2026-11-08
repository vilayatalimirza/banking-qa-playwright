import { test } from '../../fixtures';
import { accountById } from '../../pages/OverviewPage';
import { Checks } from '../../utils/checks';
import { observe, pageMessage } from '../../utils/findings';

test(
  'transferring from an account to itself is refused and leaves no trace',
  { tag: ['@negative'] },
  async ({ page, twoAccounts }) => {
    const { pages, sourceId, savingsId } = twoAccounts;
    const AMOUNT = 1000; // $10.00

    await pages.overview.open();
    const before = await pages.overview.read(2);

    await pages.transfer.open();
    const submit = await pages.transfer.attempt('10.00', sourceId, sourceId);
    const message = await pageMessage(page);

    await pages.overview.open();
    const after = await pages.overview.read(2);

    // A self-transfer nets to zero, so balances cannot show it. The statement can.
    await pages.overview.openAccount(sourceId);
    const rows = await pages.details.activity();
    const recorded = rows.filter((r) => r.debitCents === AMOUNT || r.creditCents === AMOUNT).length;

    const checks = new Checks();
    checks.check('INVARIANT', 'the bank total is unchanged', after.totalCents === before.totalCents, `before ${before.totalCents}, after ${after.totalCents}`);
    checks.check('INVARIANT', 'the other account is untouched', accountById(after, savingsId).balanceCents === accountById(before, savingsId).balanceCents, 'savings balance changed');
    checks.check('REQUIREMENT', 'a transfer to the same account must not be recorded', recorded === 0, `${recorded} statement rows for $10.00`);

    observe('self-transfer', {
      requestSent: submit.requestSent,
      status: submit.status,
      statementRowsRecorded: recorded,
      message,
      verdict: checks.verdict,
    });
  },
);
