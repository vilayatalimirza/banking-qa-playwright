import type { Locator, Page } from '@playwright/test';
import { toDecimalInput } from '../utils/format';
import { readActivityRows, type ActivityRow } from './activity';

export class FindTransactionsPage {
  private readonly account: Locator;
  private readonly amount: Locator;
  private readonly findByAmountButton: Locator;

  constructor(private readonly page: Page) {
    // Unlabelled form controls (and four buttons that all say "Find Transactions"): ids are the hook.
    this.account = page.locator('#accountId');
    this.amount = page.locator('#amount'); // was id="criteria.amount" until the demo renamed it (seen 2026-11-14)
    this.findByAmountButton = page.locator('#findByAmount');
  }

  get contract(): Record<string, Locator> {
    return {
      account: this.account,
      amount: this.amount,
      findByAmountButton: this.findByAmountButton,
    };
  }

  async open(): Promise<void> {
    await this.page.getByRole('link', { name: 'Find Transactions' }).click();
  }

  async findByAmount(accountId: string, amountCents: number): Promise<ActivityRow[]> {
    await this.account.selectOption(accountId);
    await this.amount.fill(toDecimalInput(amountCents));
    await this.findByAmountButton.click();
    return readActivityRows(this.page);
  }
}
