import { expect, type Locator, type Page } from '@playwright/test';

export class UpdateProfilePage {
  /** Exposed so tests can assert the saved value with a web-first assertion. */
  readonly phone: Locator;
  private readonly submit: Locator;

  constructor(private readonly page: Page) {
    // Same table layout as the registration form: find the row by its label text.
    this.phone = page.getByRole('row').filter({ hasText: 'Phone #:' }).getByRole('textbox');
    this.submit = page.getByRole('button', { name: 'Update Profile', exact: true });
  }

  get contract(): Record<string, Locator> {
    return { phone: this.phone, submit: this.submit };
  }

  async open(): Promise<void> {
    await this.page.getByRole('link', { name: 'Update Contact Info' }).click();
    // The form is filled by a script after the page loads, and the button only works once that has run.
    // Clicking earlier does nothing, so wait until the saved phone number is shown.
    await expect(this.phone).not.toHaveValue('', { timeout: 20_000 });
  }

  async updatePhone(newPhone: string): Promise<void> {
    await this.phone.fill(newPhone);
    await this.submit.click();
    // The demo can take several seconds to answer, so wait longer than the 5 s default.
    await expect(this.page.getByRole('heading', { name: 'Profile Updated' })).toBeVisible({ timeout: 20_000 });
  }
}
