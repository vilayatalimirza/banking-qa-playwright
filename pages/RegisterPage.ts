import { expect, type Locator, type Page } from '@playwright/test';
import type { Customer } from '../data/factories';

export class RegisterPage {
  constructor(private readonly page: Page) {}

  /** The form is a table: each row holds a text label and an input. */
  private textField(label: string): Locator {
    return this.page.getByRole('row').filter({ hasText: label }).getByRole('textbox');
  }

  /** Password inputs have no "textbox" role, so we fall back to a plain input inside the row. */
  private passwordField(label: string): Locator {
    return this.page.getByRole('row').filter({ hasText: label }).locator('input');
  }

  async open(): Promise<void> {
    const response = await this.page.goto('index.htm');
    if (response && response.status() >= 400) {
      throw new Error(`ParaBank home page returned HTTP ${response.status()} while opening registration`);
    }

    const registerLink = this.page.getByRole('link', { name: 'Register' });
    try {
      await registerLink.waitFor({ state: 'visible', timeout: 5000 });
    } catch {
      const bodyText = await this.page.locator('body').innerText().catch(() => '');
      const detail = bodyText.replace(/\\s+/g, ' ').slice(0, 180) || 'page body was empty';
      throw new Error(`ParaBank Register link was unavailable after loading index.htm. Page text: ${detail}`);
    }
    await registerLink.click();
  }

  async fillForm(customer: Customer): Promise<void> {
    await this.textField('First Name:').fill(customer.firstName);
    await this.textField('Last Name:').fill(customer.lastName);
    await this.textField('Address:').fill(customer.address);
    await this.textField('City:').fill(customer.city);
    await this.textField('State:').fill(customer.state);
    await this.textField('Zip Code:').fill(customer.zipCode);
    await this.textField('Phone #:').fill(customer.phone);
    await this.textField('SSN:').fill(customer.ssn);
    await this.textField('Username:').fill(customer.username);
    await this.passwordField('Password:').fill(customer.password);
    await this.passwordField('Confirm:').fill(customer.password);
  }

  async submit(): Promise<void> {
    await this.page.getByRole('button', { name: 'Register', exact: true }).click();
  }

  /** Happy path: register and end up logged in. Waits for the welcome heading so callers never race. */
  async register(customer: Customer): Promise<void> {
    await this.open();
    await this.fillForm(customer);
    await this.submit();
    await expect(
      this.page.getByRole('heading', { name: `Welcome ${customer.username}`, exact: true }),
    ).toBeVisible();
  }
}
