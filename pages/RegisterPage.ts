import { expect, type Locator, type Page } from '@playwright/test';
import type { Customer } from '../data/factories';

export class RegisterPage {
  constructor(private readonly page: Page) {}

  async open(): Promise<void> {
    const response = await this.page.goto('index.htm');
    if (response && response.status() >= 400) {
      throw new Error(`ParaBank home page returned HTTP ${response.status()} while opening registration`);
    }

    const registerLink = this.page.locator('#loginPanel').getByRole('link', { name: 'Register' });
    try {
      await registerLink.waitFor({ state: 'visible', timeout: 5000 });
    } catch {
      const bodyText = await this.page.locator('body').innerText().catch(() => '');
      const detail = bodyText.replace(/\\s+/g, ' ').slice(0, 180) || 'page body was empty';
      throw new Error(`ParaBank Register link was unavailable after loading index.htm. Page text: ${detail}`);
    }
    await registerLink.click();
    await expect(this.page.locator('#rightPanel')).toContainText('Signing up is easy!');
  }

  /** Selects a registration control by its stable form name, never by an ancestor row. */
  private registrationField(name: string): Locator {
    return this.page.locator(`#rightPanel input[name="${name}"]`);
  }

  private async fillAndVerify(name: string, value: string): Promise<void> {
    const field = this.registrationField(name);

    await expect(field, `Registration field "${name}" should exist exactly once`).toHaveCount(1);
    await expect(field, `Registration field "${name}" should be visible`).toBeVisible();
    await expect(field, `Registration field "${name}" should be editable`).toBeEditable();

    await field.fill(value);
    await expect(field, `Registration field "${name}" should retain its value`).toHaveValue(value);
  }

  async fillForm(customer: Customer): Promise<void> {
    const fields: Array<[string, string]> = [
      ['customer.firstName', customer.firstName],
      ['customer.lastName', customer.lastName],
      ['customer.address.street', customer.address],
      ['customer.address.city', customer.city],
      ['customer.address.state', customer.state],
      ['customer.address.zipCode', customer.zipCode],
      ['customer.phoneNumber', customer.phone],
      ['customer.ssn', customer.ssn],
      ['customer.username', customer.username],
      ['customer.password', customer.password],
      ['repeatedPassword', customer.password],
    ];

    for (const [name, value] of fields) {
      await this.fillAndVerify(name, value);
    }
  }

  async submit(): Promise<void> {
    await this.page.locator('#rightPanel').getByRole('button', { name: 'Register', exact: true }).click();
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
