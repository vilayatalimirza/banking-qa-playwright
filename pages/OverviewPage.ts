import { expect, type Locator, type Page } from '@playwright/test';
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

/** Finds an account in an Overview snapshot, failing loudly if it is missing. */
export function accountById(overview: Overview, id: string): AccountRow {
  const account = overview.accounts.find((a) => a.id === id);
  if (!account) {
    const have = overview.accounts.map((a) => a.id).join(', ');
    throw new Error(`Account ${id} not found on the overview (have: ${have})`);
  }
  return account;
}

export class OverviewPage {
  constructor(private readonly page: Page) {}

  get contract(): Record<string, Locator> {
    return { table: this.page.getByRole('table') };
  }

  async open(): Promise<void> {
    await this.page.getByRole('link', { name: 'Accounts Overview' }).click();
    await expect(this.page).toHaveURL(/overview\.htm/);
    await expect(
      this.page.getByRole('heading', { name: 'Accounts Overview' }),
    ).toBeVisible({ timeout: 15_000 });
  }

  /**
   * Reads every account row and the Total, all in integer cents.
   * Pass `expectedAccountCount` when you know it: the wait then proves the page has
   * finished updating before anything is read.
   */
  async read(expectedAccountCount?: number): Promise<Overview> {
    const table = this.page.getByRole('table');

    // Account rows are the rows that contain a link (the account number).
    const accountRows = table.getByRole('row').filter({ has: this.page.getByRole('link') });
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

  /** Opens the details/activity page of one account. */
  async openAccount(id: string): Promise<void> {
    await this.page.getByRole('link', { name: id, exact: true }).click();
    await expect(this.page.getByRole('heading', { name: 'Account Details' })).toBeVisible();
  }
}