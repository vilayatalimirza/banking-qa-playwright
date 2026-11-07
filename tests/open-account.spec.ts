import { expect, test } from '@playwright/test';
import { openOverview, readOverview } from './overview-helpers';
import { registerUser } from './parabank-helpers';

test('opening a savings account moves money without creating or destroying any', async ({ page }) => {
  await registerUser(page);

  // BEFORE: read everything from the screen. Never hard-code a starting balance:
  // ParaBank's seed balance differs between runs.
  await openOverview(page);
  const before = await readOverview(page, 1);
  const source = before.accounts[0];

  // Open a SAVINGS account funded from the existing account.
  await page.getByRole('link', { name: 'Open New Account' }).click();
  // These two dropdowns have no associated labels, so we target them by id.
  await page.locator('#type').selectOption('SAVINGS');
  await page.locator('#fromAccountId').selectOption(source.id);
  await page.getByRole('button', { name: 'Open New Account' }).click();
  await expect(page.getByRole('heading', { name: 'Account Opened!' })).toBeVisible();

  // AFTER: waiting for exactly 2 rows proves the page has refreshed before we read it.
  await openOverview(page);
  const after = await readOverview(page, 2);

  const newAccount = after.accounts.find((account) => account.id !== source.id);
  const sourceAfter = after.accounts.find((account) => account.id === source.id);
  if (!newAccount || !sourceAfter) {
    throw new Error('Expected the original account and one new account on the overview');
  }

  const deposit = newAccount.balanceCents; // whatever ParaBank funded it with

  expect(deposit, 'the new account should be funded').toBeGreaterThan(0);
  expect(sourceAfter.balanceCents, 'source debited by exactly the deposit').toBe(
    source.balanceCents - deposit,
  );
  expect(after.totalCents, 'total unchanged: money moved, not created').toBe(before.totalCents);

  for (const account of after.accounts) {
    expect(account.availableCents, `available equals balance for ${account.id} (no holds)`).toBe(
      account.balanceCents,
    );
  }
});
