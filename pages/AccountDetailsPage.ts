import type { Page } from '@playwright/test';
import { readActivityRows, type ActivityRow } from './activity';

export type { ActivityRow } from './activity';

export class AccountDetailsPage {
  constructor(private readonly page: Page) {}

  /** Reads the Account Activity table (Date, Transaction, Debit, Credit). */
  async activity(): Promise<ActivityRow[]> {
    return readActivityRows(this.page);
  }
}
