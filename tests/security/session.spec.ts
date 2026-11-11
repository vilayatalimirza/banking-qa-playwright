import { expect, test } from '../../fixtures/tracked';
import { showsLoggedInUi } from '../../utils/auth';
import { Checks } from '../../utils/checks';
import { observe, pageMessage } from '../../utils/findings';

// Session and access control through the browser. Every check records what ParaBank actually does.

const PROTECTED_PAGES = [
  'overview.htm',
  'transfer.htm',
  'billpay.htm',
  'openaccount.htm',
  'updateprofile.htm',
  'requestloan.htm',
  'findtrans.htm',
];

for (const path of PROTECTED_PAGES) {
  test(`anonymous visitor cannot use ${path}`, { tag: ['@security', '@auth'] }, async ({ page }) => {
    await page.goto(path);
    const loggedInUi = await showsLoggedInUi(page);
    const loginFormShown = (await page.locator('input[name="username"]').count()) > 0;
    const message = await pageMessage(page);

    const checks = new Checks();
    checks.check('INVARIANT', 'a protected page never shows the signed-in UI to an anonymous visitor', !loggedInUi, `signed-in UI shown: ${loggedInUi}`);
    checks.check('REQUIREMENT', 'the visitor is shown the login form', loginFormShown, `login form shown: ${loginFormShown}, url ${page.url()}`);
    observe('protected-page', { path, loggedInUi, loginFormShown, url: page.url(), message, verdict: checks.verdict });
  });
}

test('logging out ends the session on the server', { tag: ['@security', '@auth'] }, async ({ page, pages }) => {
  await pages.overview.open();
  await pages.home.logout();

  await page.goto('overview.htm'); // a brand-new request: only the server decides
  const loggedInUi = await showsLoggedInUi(page);

  const checks = new Checks();
  checks.check('INVARIANT', 'after logout a protected page shows no signed-in UI', !loggedInUi, `signed-in UI shown: ${loggedInUi}`);
  observe('logout-session', { loggedInUi, url: page.url(), verdict: checks.verdict });
});

// The strongest logout check: steal the session cookie BEFORE logout and replay it AFTER.
test('a session cookie cannot be reused after logout', { tag: ['@security', '@auth'] }, async ({ browser, baseURL, page, pages }) => {
  await pages.overview.open();
  const cookies = await page.context().cookies();
  await pages.home.logout();

  const attacker = await browser.newContext({ baseURL });
  try {
    await attacker.addCookies(cookies);
    const replay = await attacker.newPage();
    await replay.goto('overview.htm');
    const loggedInUi = await showsLoggedInUi(replay);

    const checks = new Checks();
    checks.check('INVARIANT', 'a logged-out session cookie is dead on the server', !loggedInUi, `replayed cookie gave signed-in UI: ${loggedInUi}`);
    observe('cookie-replay', { cookieNames: cookies.map((c) => c.name).join(','), loggedInUi, verdict: checks.verdict });
  } finally {
    await attacker.close();
  }
});

test('the back button after logout does not reveal account data', { tag: ['@security', '@auth'] }, async ({ page, pages }) => {
  await pages.overview.open();
  await pages.home.logout();
  await page.goBack();
  await page.waitForLoadState('load');

  const accountRows = await page.getByRole('table').getByRole('row').filter({ has: page.getByRole('link') }).count();

  const checks = new Checks();
  checks.check('REQUIREMENT', 'no account rows are visible after logout and back', accountRows === 0, `${accountRows} account rows visible`);
  observe('back-after-logout', { accountRows, url: page.url(), verdict: checks.verdict });
});

test("a customer cannot open another customer's account page by URL", { tag: ['@security', '@auth'] }, async ({ page, pages, secondUser }) => {
  // Owner B is a second customer registered in its own isolated browser context.
  await secondUser.pages.overview.open();
  const ownerB = (await secondUser.pages.overview.read(1)).accounts[0];
  await pages.overview.open();
  const ownerA = (await pages.overview.read(1)).accounts[0];
  if (!ownerA || !ownerB) {
    throw new Error('both customers need an account');
  }

  // The details page fills the account number in after it loads, so a heading alone proves nothing.
  // Look for the account number itself (polling up to 5 s).
  const panelShows = async (id: string): Promise<boolean> => {
    try {
      await expect.poll(async () => (await page.locator('#rightPanel').innerText()).includes(id), { timeout: 5000 }).toBe(true);
      return true;
    } catch {
      return false;
    }
  };

  // Control: the same detection works for the owner. Without this, a broken detector would make the test pass for nothing.
  await page.goto(`activity.htm?id=${ownerA.id}`);
  const controlOk = await panelShows(ownerA.id);
  // If the detector cannot even see A's own number, the result would mean nothing: skip visibly (an expected-failure
  // mark would otherwise hide this as a "pass").
  test.skip(!controlOk, "control failed: the detector cannot see A's own account number");

  await page.goto(`activity.htm?id=${ownerB.id}`);
  const showsDetails = await panelShows(ownerB.id);
  const message = await pageMessage(page);

  const checks = new Checks();
  checks.check('INVARIANT', "a customer never sees another customer's account details", !showsDetails, `A opened B's account ${ownerB.id}: ${showsDetails}`);
  observe('ui-idor', { showsDetails, message, verdict: checks.verdict });
});
