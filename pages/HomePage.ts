import { expect, type Page } from '@playwright/test';

export class HomePage {
  constructor(private readonly page: Page) {}

  async login(username: string, password: string): Promise<void> {
    // ParaBank's login inputs are not associated with their visible labels,
    // so we target them by name attribute (no role/label alternative exists).
    await this.page.locator('input[name="username"]').fill(username);
    await this.page.locator('input[name="password"]').fill(password);
    await this.page.getByRole('button', { name: 'Log In', exact: true }).click();
    await expect(this.page).toHaveURL(/overview\.htm/);
  }

  async logout(): Promise<void> {
    await this.page.getByRole('link', { name: 'Log Out' }).click();
    // Proves the session ended: the login form is back.
    await expect(this.page.getByRole('button', { name: 'Log In', exact: true })).toBeVisible();
  }
}
