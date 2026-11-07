import { expect, type Locator, type Page } from '@playwright/test';

export type AccountType = 'CHECKING' | 'SAVINGS';

export class OpenAccountPage {
  private readonly type: Locator;
  private readonly fromAccount: Locator;
  private readonly submit: Locator;

  constructor(private readonly page: Page) {
    // The two dropdowns have no associated labels, so we target them by id.
    this.type = page.locator('#type');
    this.fromAccount = page.locator('#fromAccountId');
    this.submit = page.getByRole('button', { name: 'Open New Account', exact: true });
  }

  get contract(): Record<string, Locator> {
    return { type: this.type, fromAccount: this.fromAccount, submit: this.submit };
  }

  async open(): Promise<void> {
    await this.page.getByRole('link', { name: 'Open New Account' }).click();
  }

  /** Opens an account funded from `fromAccountId` and returns the new account number. */
  async openAccount(type: AccountType, fromAccountId: string): Promise<string> {
    await this.type.selectOption(type);
    await this.fromAccount.selectOption(fromAccountId);
    await this.submit.click();
    await expect(this.page.getByRole('heading', { name: 'Account Opened!' })).toBeVisible();

    // The new account number is the only all-digits link on the confirmation page.
    const newId = await this.page.getByRole('link', { name: /^\d+$/ }).innerText();
    return newId.trim();
  }
}
