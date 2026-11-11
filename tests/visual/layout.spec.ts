import { expect, test } from '../../fixtures/tracked';

// Visual regression: each test compares one page region with a stored baseline image.
// Baselines are per operating system (the file name carries it), so generate them where you run them:
//   npx playwright test -c playwright.ci.config.ts --project=visual --update-snapshots
// Review the new images in tests/visual/layout.spec.ts-snapshots/, commit them, and later runs compare against them.
// Anything that changes per run (account numbers, balances, dates) is masked, so only layout and styling are judged.

const SHOT = { animations: 'disabled' as const, maxDiffPixelRatio: 0.02 };

// These tests only run in the "visual" project, so a plain `npx playwright test` never fails for a missing baseline.
test.beforeEach(({}, testInfo) => {
  test.skip(testInfo.project.name !== 'visual', 'run with: npx playwright test -c playwright.ci.config.ts --project=visual');
});

test.describe('visual: anonymous pages', () => {
  test('login panel', { tag: ['@visual'] }, async ({ page }) => {
    await page.goto('index.htm');
    await expect(page.locator('#leftPanel')).toHaveScreenshot('login-panel.png', SHOT);
  });

  test('registration form', { tag: ['@visual'] }, async ({ page }) => {
    await page.goto('register.htm');
    await expect(page.locator('input[id="customer.firstName"]')).toBeVisible();
    await expect(page.locator('#rightPanel')).toHaveScreenshot('register-form.png', SHOT);
  });
});

test.describe('visual: signed-in pages', () => {
  test('transfer form', { tag: ['@visual'] }, async ({ page, pages }) => {
    void pages; // registers and logs in
    await page.goto('transfer.htm');
    await expect(page.locator('#fromAccountId')).toBeVisible();
    await expect(page.locator('#rightPanel')).toHaveScreenshot('transfer-form.png', { ...SHOT, mask: [page.locator('select')] });
  });

  test('bill pay form', { tag: ['@visual'] }, async ({ page, pages }) => {
    void pages;
    await page.goto('billpay.htm');
    await expect(page.locator('input[name="payee.name"]')).toBeVisible();
    await expect(page.locator('#rightPanel')).toHaveScreenshot('billpay-form.png', { ...SHOT, mask: [page.locator('select')] });
  });

  test('open account form', { tag: ['@visual'] }, async ({ page, pages }) => {
    void pages;
    await page.goto('openaccount.htm');
    await expect(page.locator('#type')).toBeVisible();
    await expect(page.locator('#rightPanel')).toHaveScreenshot('openaccount-form.png', { ...SHOT, mask: [page.locator('select')] });
  });

  test('accounts overview layout', { tag: ['@visual'] }, async ({ page, pages }) => {
    await pages.overview.open();
    await pages.overview.read(1); // wait until the account table has loaded
    // The table holds account numbers and balances (different every run): masked, so only the layout is judged.
    await expect(page.locator('#rightPanel')).toHaveScreenshot('overview-layout.png', { ...SHOT, mask: [page.getByRole('table')] });
  });
});
