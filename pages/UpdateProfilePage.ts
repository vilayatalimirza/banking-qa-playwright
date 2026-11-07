import { expect, type Locator, type Page } from '@playwright/test';

export class UpdateProfilePage {
  /** Exposed so tests can assert the saved value with a web-first assertion. */
  readonly phone: Locator;
  readonly firstName: Locator;
  private readonly submit: Locator;

  constructor(private readonly page: Page) {
    // Same table layout as the registration form: find the row by its label text.
    this.firstName = page.getByRole('row').filter({ hasText: 'First Name:' }).getByRole('textbox');
    this.phone = page.getByRole('row').filter({ hasText: 'Phone #:' }).getByRole('textbox');
    this.submit = page.getByRole('button', { name: 'Update Profile', exact: true });
  }

  get contract(): Record<string, Locator> {
    return { phone: this.phone, submit: this.submit };
  }

  async open(): Promise<void> {
    await this.page.getByRole('link', { name: 'Update Contact Info' }).click();
    await expect(this.firstName).not.toHaveValue('');
  }

  async updatePhone(newPhone: string): Promise<void> {
    await this.phone.fill(newPhone);
    await this.submit.click();
    await expect(this.page.getByRole('heading', { name: 'Profile Updated' })).toBeVisible();
  }
}
