import { expect, type Locator, type Page, type Request } from '@playwright/test';
import { toDecimalInput } from '../utils/format';

/** What happened when the Transfer button was pressed. */
export interface SubmitOutcome {
  requestSent: boolean; // false when the page blocked the input before sending anything
  status: number | null; // HTTP status of the transfer request, if one was sent
}

// Proving that NO request was sent needs a bounded wait: nothing can be observed to "not happen".
const NO_REQUEST_WAIT_MS = 1500;

const isTransferPost = (request: Request): boolean =>
  request.method() === 'POST' && /transfer/i.test(request.url());

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
    await expect(this.from.locator('option').first()).toBeAttached();
    await expect(this.to.locator('option').first()).toBeAttached();
  }

  /** Fills the form with raw text (so tests can type invalid amounts) without submitting. */
  async fill(amountText: string, fromId: string, toId: string): Promise<void> {
    await this.amount.fill(amountText);
    await this.from.selectOption(fromId);
    await this.to.selectOption(toId);
  }

  /** Presses Transfer and reports whether a request went out and how the server answered. */
  async clickAndObserve(): Promise<SubmitOutcome> {
    const requestPromise = this.page
      .waitForRequest(isTransferPost, { timeout: NO_REQUEST_WAIT_MS })
      .catch(() => null);
    await this.submit.click();
    const request = await requestPromise;
    if (!request) {
      return { requestSent: false, status: null };
    }
    const response = await request.response();
    await expect(
      this.page.getByRole('heading', { name: /Transfer Complete!|Error!/ }),
    ).toBeVisible();
    return { requestSent: true, status: response ? response.status() : null };
  }

  /** Fill + submit with raw text. Does not assume success. */
  async attempt(amountText: string, fromId: string, toId: string): Promise<SubmitOutcome> {
    await this.fill(amountText, fromId, toId);
    return this.clickAndObserve();
  }

  /** Happy path: transfer a valid amount and wait for the confirmation. */
  async transfer(amountCents: number, fromId: string, toId: string): Promise<void> {
    await this.fill(toDecimalInput(amountCents), fromId, toId);
    await this.submit.click();
    await expect(this.page.getByRole('heading', { name: 'Transfer Complete!' })).toBeVisible();
  }

  /** Double-clicks Transfer: two clicks in a few milliseconds, like an impatient user. */
  async submitTwice(): Promise<void> {
    await this.submit.dblclick();
  }
}