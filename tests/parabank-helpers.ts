import { randomUUID } from 'node:crypto';
import { expect, type Page } from '@playwright/test';

export interface TestUser {
  username: string;
  password: string;
}

/**
 * Registers a brand-new ParaBank user through the UI and leaves the browser
 * logged in on the post-registration page. Uses synthetic data only.
 */
export async function registerUser(page: Page): Promise<TestUser> {
  const user: TestUser = {
    // Random suffix: safe even when parallel workers register at the same millisecond.
    username: `qa_${randomUUID().slice(0, 8)}`,
    password: 'TestPass123',
  };

  await page.goto('index.htm');
  await page.getByRole('link', { name: 'Register' }).click();

  // The form is a table: each row has a text label and an input.
  const fillRow = async (label: string, value: string) => {
    await page
      .getByRole('row')
      .filter({ hasText: label })
      .getByRole('textbox')
      .fill(value);
  };

  await fillRow('First Name:', 'QA');
  await fillRow('Last Name:', 'Tester');
  await fillRow('Address:', '123 Test Street');
  await fillRow('City:', 'Testville');
  await fillRow('State:', 'CA');
  await fillRow('Zip Code:', '90210');
  await fillRow('Phone #:', '5551234567');
  await fillRow('SSN:', '123456789');
  await fillRow('Username:', user.username);

  // Password inputs have no "textbox" role, so we fall back to a plain input locator.
  await page.getByRole('row').filter({ hasText: 'Password:' }).locator('input').fill(user.password);
  await page.getByRole('row').filter({ hasText: 'Confirm:' }).locator('input').fill(user.password);

  await page.getByRole('button', { name: 'Register' }).click();

  // Specific success check: if registration fails, this fails with a clear reason.
  await expect(
    page.getByRole('heading', { name: `Welcome ${user.username}`, exact: true }),
  ).toBeVisible();

  return user;
}
