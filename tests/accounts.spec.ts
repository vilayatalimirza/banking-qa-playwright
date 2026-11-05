import { expect, test } from '@playwright/test';
import { parseMoney } from '../utils/money';
import { registerUser } from './parabank-helpers';

const BALANCE_PATTERN = /^-?\$\d{1,3}(,\d{3})*\.\d{2}$/;

test('overview total equals the sum of account balances', async ({ page }) => {
  await registerUser(page);
  await page.getByRole('link', { name: 'Accounts Overview' }).click();
  await expect(page.getByRole('heading', { name: 'Accounts Overview' })).toBeVisible();

  const table = page.getByRole('table');

  // Account rows are the rows that contain a link (the account number).
  const accountRows = table.getByRole('row').filter({ has: page.getByRole('link') });
  await expect(accountRows.first()).toBeVisible();
  await expect(accountRows.first().getByRole('cell').first()).toHaveText(/^\d+$/);

  const accountBalances: number[] = [];
  for (const row of await accountRows.all()) {
    const balanceCell = row.getByRole('cell').nth(1);
    await expect(balanceCell).toHaveText(BALANCE_PATTERN);
    accountBalances.push(parseMoney(await balanceCell.innerText()));
  }

  const totalRow = table.getByRole('row').filter({ hasText: /^Total\b/ });
  await expect(totalRow).toBeVisible();
  const totalBalanceCell = totalRow.getByRole('cell').nth(1);
  await expect(totalBalanceCell).toHaveText(BALANCE_PATTERN);

  const sumCents = accountBalances.reduce((total, balance) => total + balance, 0);
  expect(parseMoney(await totalBalanceCell.innerText())).toBe(sumCents);
});

