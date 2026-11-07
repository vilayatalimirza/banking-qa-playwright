import { expect, type Locator, type Page } from '@playwright/test';
import { toDecimalInput } from '../utils/format';

export interface LoanResult {
  status: 'Approved' | 'Denied';
  newAccountId?: string; // only present when the loan is approved
}

export class RequestLoanPage {
  private readonly amount: Locator;
  private readonly downPayment: Locator;
  private readonly fromAccount: Locator;
  private readonly submit: Locator;
  private readonly status: Locator;

  constructor(private readonly page: Page) {
    // Unlabelled form controls and result cells: ids are the reliable hook.
    this.amount = page.locator('#amount');
    this.downPayment = page.locator('#downPayment');
    this.fromAccount = page.locator('#fromAccountId');
    this.submit = page.getByRole('button', { name: 'Apply Now', exact: true });
    this.status = page.locator('#loanStatus');
  }

  get contract(): Record<string, Locator> {
    return {
      amount: this.amount,
      downPayment: this.downPayment,
      fromAccount: this.fromAccount,
      submit: this.submit,
    };
  }

  async open(): Promise<void> {
    await this.page.getByRole('link', { name: 'Request Loan' }).click();
  }

  async apply(loanCents: number, downPaymentCents: number, fromAccountId: string): Promise<LoanResult> {
    await this.amount.fill(toDecimalInput(loanCents));
    await this.downPayment.fill(toDecimalInput(downPaymentCents));
    await this.fromAccount.selectOption(fromAccountId);
    await this.submit.click();

    await expect(this.status).toHaveText(/Approved|Denied/);
    const status = (await this.status.innerText()).trim() as LoanResult['status'];

    if (status === 'Approved') {
      // The new loan account number is the only all-digits link on the result page.
      const newAccountId = (await this.page.getByRole('link', { name: /^\d+$/ }).innerText()).trim();
      return { status, newAccountId };
    }
    return { status };
  }
}
