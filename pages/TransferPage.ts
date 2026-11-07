import { expect, type Locator, type Page } from '@playwright/test';
import { toDecimalInput } from '../utils/format';

export class TransferPage {
  private readonly amount: Locator;
  private readonly from: Locator;
  private readonly to: Locator;
  private readonly submit: Locator;

  constructor(private readonly page: Page) {
    // Unlabelled form controls: ids are the reliable hook here.
    this.amount = page.locator('#amount');
    this.from = page.locator('#fromAccountId');
    this.to = page.locator('#toAccountId');
    this.submit = page.getByRole('button', { name: 'Transfer', exact: true });
  }

  get contract(): Record<string, Locator> {
    return { amount: this.amount, from: this.from, to: this.to, submit: this.submit };
  }

  async open(): Promise<void> {
    await this.page.getByRole('link', { name: 'Transfer Funds' }).click();
  }

  async transfer(amountCents: number, fromId: string, toId: string): Promise<void> {
    await this.amount.fill(toDecimalInput(amountCents));
    await this.from.selectOption(fromId);
    await this.to.selectOption(toId);
    await this.submit.click();
    await expect(this.page.getByRole('heading', { name: 'Transfer Complete!' })).toBeVisible();
  }
}
