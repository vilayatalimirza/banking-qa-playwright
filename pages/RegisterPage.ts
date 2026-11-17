import { expect, type Page } from '@playwright/test';
import type { Customer } from '../data/factories';

export class RegisterPage {
  constructor(private readonly page: Page) {}

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
      const detail = bodyText.replace(/\s+/g, ' ').slice(0, 180) || 'page body was empty';
      throw new Error(`ParaBank Register link was unavailable after loading index.htm. Page text: ${detail}`);
    }
    await registerLink.click();
  }

  async fillForm(customer: Customer): Promise<void> {
    // Use ParaBank's stable field IDs instead of filtering table rows by label text.
    // Verify each non-password field immediately so a missed fill is caught before submission.
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
    ];

    for (const [id, value] of fields) {
      const field = this.page.locator(`input[id="${id}"]`);
      await expect(field, `Registration field ${id} should exist exactly once`).toHaveCount(1);
      await field.fill(value);
      await expect(field, `Registration field ${id} should retain its value`).toHaveValue(value);
    }

    const password = this.page.locator('input[id="customer.password"]');
    const confirmation = this.page.locator('input[id="repeatedPassword"]');
    await expect(password).toHaveCount(1);
    await expect(confirmation).toHaveCount(1);
    await password.fill(customer.password);
    await confirmation.fill(customer.password);
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
