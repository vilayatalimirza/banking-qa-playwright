import { expect, test } from '../../fixtures';

test('overview total equals the sum of account balances', { tag: ['@smoke'] }, async ({ pages }) => {
  await pages.overview.open();
  const overview = await pages.overview.read();

  const sumCents = overview.accounts.reduce((total, account) => total + account.balanceCents, 0);
  expect(overview.totalCents).toBe(sumCents);
});
