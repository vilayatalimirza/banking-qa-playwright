import { expect, test } from '@playwright/test';
import { registerUser } from './parabank-helpers';

test('a registered user can log out and log back in', async ({ page }) => {
  // registerUser already asserts the "Welcome <username>" heading.
  const user = await registerUser(page);

  await page.getByRole('link', { name: 'Log Out' }).click();
  await expect(page.getByRole('button', { name: 'Log In' })).toBeVisible();

  // ParaBank's login inputs are not associated with their visible text labels,
  // so we target them by their name attribute (no role/label alternative exists).
  await page.locator('input[name="username"]').fill(user.username);
  await page.locator('input[name="password"]').fill(user.password);
  await page.getByRole('button', { name: 'Log In' }).click();

  await expect(page).toHaveURL(/overview\.htm/);
  await expect(page.getByRole('heading', { name: 'Accounts Overview' })).toBeVisible();
});
 