import type { Page } from '@playwright/test';

/** True when the page shows the signed-in UI (ParaBank shows a "Log Out" link only to signed-in users). */
export async function showsLoggedInUi(page: Page): Promise<boolean> {
  return (await page.getByRole('link', { name: 'Log Out' }).count()) > 0;
}
