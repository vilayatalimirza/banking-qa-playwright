import { expect, type Locator, type Page } from '@playwright/test';
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
      const detail = bodyText.replace(/\\s+/g, ' ').slice(0, 180) || 'page body was empty';
      throw new Error(`ParaBank Register link was unavailable after loading index.htm. Page text: ${detail}`);
    }
    await registerLink.click();
  }

  /** Finds a registration row by its exact label inside the registration panel. */
  private registrationRow(label: string): Locator {
    const panel = this.page.locator('#rightPanel');
    return panel.getByRole('row').filter({ hasText: label });
  }

  async fillForm(customer: Customer): Promise<void> {
    const panel = this.page.locator('#rightPanel');
    await expect(panel).toContainText('Signing up is easy!');

    const fields: Array<[string, string]> = [
      ['First Name:', customer.firstName],
      ['Last Name:', customer.lastName],
      ['Address:', customer.address],
      ['City:', customer.city],
      ['State:', customer.state],
      ['Zip Code:', customer.zipCode],
      ['Phone #:', customer.phone],
      ['SSN:', customer.ssn],
      ['Username:', customer.username],
    ];

    for (const [label, value] of fields) {
      const row = this.registrationRow(label);
      await expect(row, `Registration row "${label}" should exist exactly once`).toHaveCount(1);
      await expect(row.getByRole('cell').first()).toHaveText(label);

      const field = row.getByRole('textbox');
      await expect(field, `Registration field "${label}" should exist exactly once`).toHaveCount(1);
      await expect(field, `Registration field "${label}" should be visible`).toBeVisible();
      await field.fill(value);
      await expect(field, `Registration field "${label}" should retain its value`).toHaveValue(value);
    }

    const passwordRow = this.registrationRow('Password:');
    const confirmRow = this.registrationRow('Confirm:');
    await expect(passwordRow).toHaveCount(1);
    await expect(confirmRow).toHaveCount(1);

    const password = passwordRow.locator('input[type="password"]');
    const confirmation = confirmRow.locator('input[type="password"]');
    await expect(password).toHaveCount(1);
    await expect(confirmation).toHaveCount(1);

    await password.fill(customer.password);
    await expect(password).toHaveValue(customer.password);
    await confirmation.fill(customer.password);
    await expect(confirmation).toHaveValue(customer.password);
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
