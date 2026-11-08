import { expect, test } from '../../fixtures';

const AMOUNT = 4321; // $43.21: distinctive, so only this transfer matches

test(
  'Find Transactions by amount returns the matching transaction and nothing else',
  { tag: ['@regression'] },
  async ({ twoAccounts }) => {
    const { pages, sourceId, savingsId } = twoAccounts;

    await pages.transfer.open();
    await pages.transfer.transfer(AMOUNT, sourceId, savingsId);

    await pages.findTransactions.open();
    const rows = await pages.findTransactions.findByAmount(savingsId, AMOUNT);

    // The savings account also holds its opening-deposit credit; the search must exclude it.
    expect(rows, 'exactly one transaction matches the amount').toHaveLength(1);
    expect(rows[0].creditCents, 'and it is the credit we just made').toBe(AMOUNT);
  },
);
