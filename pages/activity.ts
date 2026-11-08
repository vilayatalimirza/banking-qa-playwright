import { expect, type Page } from '@playwright/test';
import { parseMoney } from '../utils/money';

export interface ActivityRow {
  date: string;
  description: string;
  debitCents: number | null; // null when the debit cell is empty
  creditCents: number | null; // null when the credit cell is empty
}

function parseOptionalMoney(text: string): number | null {
  const trimmed = text.trim();
  return trimmed === '' ? null : parseMoney(trimmed);
}

/**
 * Reads a transaction table (Date, Transaction, Debit, Credit). Shared by the account
 * statement page and the Find Transactions results, which use the same layout.
 */
export async function readActivityRows(page: Page): Promise<ActivityRow[]> {
  // The activity table is the one with the "Debit (-)" header.
  const table = page.getByRole('table').filter({ hasText: 'Debit (-)' });
  // Data rows are the rows with a link (the transaction description).
  const rows = table.getByRole('row').filter({ has: page.getByRole('link') });
  await expect(rows.first()).toBeVisible();

  const result: ActivityRow[] = [];
  for (const row of await rows.all()) {
    const cells = row.getByRole('cell');
    result.push({
      date: (await cells.nth(0).innerText()).trim(),
      description: (await cells.nth(1).innerText()).trim(),
      debitCents: parseOptionalMoney(await cells.nth(2).innerText()),
      creditCents: parseOptionalMoney(await cells.nth(3).innerText()),
    });
  }
  return result;
}
