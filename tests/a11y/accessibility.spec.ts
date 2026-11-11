import { expect, test } from '../../fixtures/tracked';
import { axeScan } from '../../utils/a11y';
import { showsLoggedInUi } from '../../utils/auth';
import { Checks } from '../../utils/checks';
import { observe } from '../../utils/findings';

// Accessibility: an automated axe-core scan (WCAG 2.x A and AA) plus a keyboard-only login.
// Automated scans catch roughly a third of real accessibility problems, so these are a floor, not a certificate.

const ANONYMOUS_PAGES = ['index.htm', 'register.htm', 'about.htm', 'contact.htm'];

for (const path of ANONYMOUS_PAGES) {
  test(`accessibility: ${path} has no serious violations`, { tag: ['@a11y'] }, async ({ page }) => {
    await page.goto(path);
    await page.waitForLoadState('networkidle');
    const result = await axeScan(page);

    const checks = new Checks();
    checks.check('REQUIREMENT', 'no serious or critical accessibility violations', result.serious === 0, result.seriousSummary || 'none');
    observe('a11y', { page: path, violations: result.total, serious: result.serious, rules: result.summary.slice(0, 500), verdict: checks.verdict });
  });
}

const SIGNED_IN_PAGES = [
  'overview.htm',
  'openaccount.htm',
  'transfer.htm',
  'billpay.htm',
  'findtrans.htm',
  'updateprofile.htm',
  'requestloan.htm',
];

// One customer, many pages: registering once keeps the run short on the shared demo.
test('accessibility: signed-in pages have no serious violations', { tag: ['@a11y'] }, async ({ page, pages }) => {
  test.setTimeout(120_000);
  void pages; // the fixture registers and logs the customer in
  const checks = new Checks();

  for (const path of SIGNED_IN_PAGES) {
    await test.step(path, async () => {
      await page.goto(path);
      await page.waitForLoadState('networkidle');
      const result = await axeScan(page);
      checks.check('REQUIREMENT', `${path}: no serious or critical violations`, result.serious === 0, result.seriousSummary || 'none');
      observe('a11y', { page: path, violations: result.total, serious: result.serious, rules: result.summary.slice(0, 500), verdict: result.serious === 0 ? 'OK' : `serious: ${result.seriousSummary}` });
    });
  }
});

test('the login form can be completed with the keyboard alone', { tag: ['@a11y'] }, async ({ page, pages, customer }) => {
  await pages.home.logout();
  await pages.home.open();

  await page.locator('input[name="username"]').focus();
  await page.keyboard.type(customer.username);
  await page.keyboard.press('Tab'); // the next focusable control must be the password field
  await page.keyboard.type(customer.password);
  await page.keyboard.press('Enter');

  const loggedIn = await expect.poll(() => showsLoggedInUi(page), { timeout: 10_000 }).toBe(true).then(() => true, () => false);

  const checks = new Checks();
  checks.check('REQUIREMENT', 'username, Tab, password, Enter logs the customer in', loggedIn, loggedIn ? 'logged in' : 'not logged in by keyboard');
  observe('a11y-keyboard-login', { loggedIn, verdict: checks.verdict });
});
