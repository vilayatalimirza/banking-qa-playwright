import { expect, test } from '../../fixtures';
import { accountById } from '../../pages/OverviewPage';

// State-transition style test: drive the savings account through a sequence of states
// (opened, credited, debited) and check that replaying its statement reproduces the balance.
// Reconciliation: the ledger (statement) and the balance must always agree.

test(
  'the savings statement replays to the displayed balance',
  { tag: ['@regression'] },
  async ({ twoAccounts }) => {
    const { pages, sourceId, savingsId } = twoAccounts;
    const MONEY_IN = 2500; // $25.00 into savings
    const MONEY_OUT = 700; // $7.00 back out of savings

    await pages.transfer.open();
    await pages.transfer.transfer(MONEY_IN, sourceId, savingsId);
    await pages.transfer.open();
    await pages.transfer.transfer(MONEY_OUT, savingsId, sourceId);

    await pages.overview.open();
    const overview = await pages.overview.read(2);
    const savingsBalance = accountById(overview, savingsId).balanceCents;

    await pages.overview.openAccount(savingsId);
    const rows = await pages.details.activity();

    // Savings started at zero, so its whole history is on the statement.
    const replayed = rows.reduce((sum, row) => sum + (row.creditCents ?? 0) - (row.debitCents ?? 0), 0);

    expect(rows, 'opening deposit + one credit + one debit').toHaveLength(3);
    expect(replayed, 'statement replay equals the displayed balance').toBe(savingsBalance);
  },
);
