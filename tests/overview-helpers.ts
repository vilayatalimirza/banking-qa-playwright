import { expect, type Page } from '@playwright/test';
import { readAmount } from '../utils/amount';

export interface AccountRow {
  id: string;
  balanceCents: number;
  availableCents: number;
}

export interface Overview {
  accounts: AccountRow[];
  totalCents: number;
}

/** Navigates to Accounts Overview and waits for its heading. */
export async function openOverview(page: Page): Promise<void> {
  await page.getByRole('link', { name: 'Accounts Overview' }).click();
  await expect(page.getByRole('heading', { name: 'Accounts Overview' })).toBeVisible();
}

/**
 * Reads every account row and the Total, all in integer cents.
 * Pass `expectedAccountCount` when you know it: the wait then proves the page has finished
 * updating (for example right after opening a new account) before anything is read.
 */
export async function readOverview(page: Page, expectedAccountCount?: number): Promise<Overview> {
  const table = page.getByRole('table');

  // Account rows are the rows that contain a link (the account number).
  const accountRows = table.getByRole('row').filter({ has: page.getByRole('link') });
  if (expectedAccountCount === undefined) {
    await expect(accountRows.first()).toBeVisible();
  } else {
    await expect(accountRows).toHaveCount(expectedAccountCount);
  }

  const accounts: AccountRow[] = [];
  for (const row of await accountRows.all()) {
    const cells = row.getByRole('cell');
    await expect(cells.nth(0)).toHaveText(/^\d+$/);
    accounts.push({
      id: (await cells.nth(0).innerText()).trim(),
      balanceCents: await readAmount(cells.nth(1)),
      availableCents: await readAmount(cells.nth(2)),
    });
  }

  const totalRow = table.getByRole('row').filter({ hasText: /^Total\b/ });
  const totalCents = await readAmount(totalRow.getByRole('cell').nth(1));

  return { accounts, totalCents };
}
