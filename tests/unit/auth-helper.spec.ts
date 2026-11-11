import { expect, test } from '@playwright/test';
import { showsLoggedInUi } from '../../utils/auth';

test('showsLoggedInUi is true only when a Log Out link is present', async ({ page }) => {
  await page.setContent('<a href="#">Log Out</a>');
  expect(await showsLoggedInUi(page)).toBe(true);

  await page.setContent('<form><input name="username"></form><a href="#">Register</a>');
  expect(await showsLoggedInUi(page)).toBe(false);
});
