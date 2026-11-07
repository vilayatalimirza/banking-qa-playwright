import { expect, test } from '@playwright/test';
import { openOverview, readOverview } from './overview-helpers';
import { registerUser } from './parabank-helpers';

test('overview total equals the sum of account balances', async ({ page }) => {
  await registerUser(page);
  await openOverview(page);

  const overview = await readOverview(page);

  const sumCents = overview.accounts.reduce((total, account) => total + account.balanceCents, 0);
  expect(overview.totalCents).toBe(sumCents);
});
