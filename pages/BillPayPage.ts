import { expect, type Locator, type Page } from '@playwright/test';
import type { Payee } from '../data/factories';
import { toDecimalInput } from '../utils/format';

export class BillPayPage {
  private readonly payeeName: Locator;
  private readonly address: Locator;
  private readonly city: Locator;
  private readonly state: Locator;
  private readonly zipCode: Locator;
  private readonly phone: Locator;
  private readonly accountNumber: Locator;
  private readonly verifyAccount: Locator;
  private readonly amount: Locator;
  private readonly fromAccount: Locator;
  private readonly submit: Locator;

  constructor(private readonly page: Page) {
    // The form inputs have no associated labels; their name attributes are the stable hook.
    const input = (name: string): Locator => page.locator(`input[name="${name}"]`);
    this.payeeName = input('payee.name');
    this.address = input('payee.address.street');
    this.city = input('payee.address.city');
    this.state = input('payee.address.state');
    this.zipCode = input('payee.address.zipCode');
    this.phone = input('payee.phoneNumber');
    this.accountNumber = input('payee.accountNumber');
    this.verifyAccount = input('verifyAccount');
    this.amount = input('amount');
    this.fromAccount = page.locator('select[name="fromAccountId"]');
    this.submit = page.getByRole('button', { name: 'Send Payment', exact: true });
  }

  get contract(): Record<string, Locator> {
    return {
      payeeName: this.payeeName,
      address: this.address,
      city: this.city,
      state: this.state,
      zipCode: this.zipCode,
      phone: this.phone,
      accountNumber: this.accountNumber,
      verifyAccount: this.verifyAccount,
      amount: this.amount,
      fromAccount: this.fromAccount,
      submit: this.submit,
    };
  }

  async open(): Promise<void> {
    await this.page.getByRole('link', { name: 'Bill Pay' }).click();
  }

  async pay(payee: Payee, amountCents: number, fromAccountId: string): Promise<void> {
    await this.payeeName.fill(payee.name);
    await this.address.fill(payee.address);
    await this.city.fill(payee.city);
    await this.state.fill(payee.state);
    await this.zipCode.fill(payee.zipCode);
    await this.phone.fill(payee.phone);
    await this.accountNumber.fill(payee.accountNumber);
    await this.verifyAccount.fill(payee.accountNumber);
    await this.amount.fill(toDecimalInput(amountCents));
    await this.fromAccount.selectOption(fromAccountId);
    await this.submit.click();
    await expect(this.page.getByRole('heading', { name: 'Bill Payment Complete' })).toBeVisible();
  }
}
