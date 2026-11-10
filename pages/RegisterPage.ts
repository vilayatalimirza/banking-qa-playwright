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
    await this.page.goto('index.htm');
    await this.page.getByRole('link', { name: 'Register' }).click();
    await expect(this.page).toHaveURL(/register\.htm/);
    await expect(this.textField('First Name:')).toBeVisible();
  }

  async fillForm(customer: Customer): Promise<void> {
    const fields: Array<[Locator, string]> = [
      [this.textField('First Name:'), customer.firstName],
      [this.textField('Last Name:'), customer.lastName],
      [this.textField('Address:'), customer.address],
      [this.textField('City:'), customer.city],
      [this.textField('State:'), customer.state],
      [this.textField('Zip Code:'), customer.zipCode],
      [this.textField('Phone #:'), customer.phone],
      [this.textField('SSN:'), customer.ssn],
      [this.textField('Username:'), customer.username],
      [this.passwordField('Password:'), customer.password],
      [this.passwordField('Confirm:'), customer.password],
    ];

    for (const [locator, value] of fields) {
      await expect(async () => {
        await locator.fill(value);
        await expect(locator).toHaveValue(value, { timeout: 500 });
      }).toPass({ timeout: 5000 });
    }
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