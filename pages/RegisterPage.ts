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
