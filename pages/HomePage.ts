import { expect, type Page } from '@playwright/test';

export class HomePage {
  constructor(private readonly page: Page) {}

  async open(): Promise<void> {
    await this.page.goto('index.htm');
  }

  async login(username: string, password: string): Promise<void> {
    await this.fillCredentials(username, password);
    await this.page.getByRole('button', { name: 'Log In', exact: true }).click();
    await expect(this.page).toHaveURL(/overview\.htm/);
  }

  /**
   * Submits credentials and waits for the server to answer, WITHOUT assuming the login works.
   * Callers then check whether a session exists (for example by opening overview.htm).
   */
  async attemptLogin(username: string, password: string): Promise<void> {
    await this.fillCredentials(username, password);
    const responsePromise = this.page.waitForResponse(
      (response) => response.request().method() === 'POST' && /login/i.test(response.url()),
    );
    await this.page.getByRole('button', { name: 'Log In', exact: true }).click();
    await responsePromise;
  }

  async logout(): Promise<void> {
    await this.page.getByRole('link', { name: 'Log Out' }).click();
    // Proves the session ended: the login form is back.
    await expect(this.page.getByRole('button', { name: 'Log In', exact: true })).toBeVisible();
  }

  private async fillCredentials(username: string, password: string): Promise<void> {
    // ParaBank's login inputs are not associated with their visible labels,
    // so we target them by name attribute (no role/label alternative exists).
    await this.page.locator('input[name="username"]').fill(username);
    await this.page.locator('input[name="password"]').fill(password);
  }
}
