import { buildPayee } from '../../data/factories';
import { test } from '../../fixtures/tracked';
import { Checks } from '../../utils/checks';
import { observe } from '../../utils/findings';

// Gentle input-injection probes: ONE request per payload, NON-DESTRUCTIVE payloads only (nothing
// that deletes or changes data). Run only against systems you are allowed to test (the ParaBank demo).
// Security testing goes deeper in Package D.

const sqlPayloads = ["' OR '1'='1", "admin'--"];

for (const payload of sqlPayloads) {
  test(`login rejects the SQL-injection payload ${payload}`, { tag: ['@negative', '@security'] }, async ({ page, anonymousPages }) => {
    await anonymousPages.home.open();
    await anonymousPages.home.attemptLogin(payload, 'not-a-real-password');

    // Ask the server whether a session exists: open a page that needs one.
    await page.goto('overview.htm');
    const loggedIn = (await page.getByRole('heading', { name: 'Accounts Overview' }).count()) > 0;

    const checks = new Checks();
    checks.check('INVARIANT', 'an injection payload must never authenticate', !loggedIn, loggedIn ? 'a session was created' : 'no session');

    observe('sql-injection-login', { payload, sessionCreated: loggedIn, verdict: checks.verdict });
  });
}

const xssPayloads = ['<img src=x onerror=alert(1)>', '"><b id="xss-probe">x</b>'];

for (const payload of xssPayloads) {
  test(`bill pay does not execute or render the payee-name payload ${payload}`, { tag: ['@negative', '@security'] }, async ({ page, pages }) => {
    const dialogs: string[] = [];
    page.on('dialog', (dialog) => {
      dialogs.push(dialog.message());
      void dialog.dismiss();
    });

    await pages.overview.open();
    const source = (await pages.overview.read(1)).accounts[0];

    await pages.billPay.open();
    const submit = await pages.billPay.attempt(buildPayee({ name: payload }), '1.00', source.id);
    // A script that fires on a broken image needs a moment after the page updates.
    await page.waitForLoadState('networkidle');

    const injectedElements = await page.locator('#xss-probe').count();

    const checks = new Checks();
    checks.check('INVARIANT', 'payee text must never run as script', dialogs.length === 0, `${dialogs.length} dialogs fired`);
    checks.check('INVARIANT', 'payee text must never be rendered as HTML', injectedElements === 0, `${injectedElements} injected elements`);

    observe('xss-billpay', { payload, requestSent: submit.requestSent, status: submit.status, dialogs: dialogs.length, injectedElements, verdict: checks.verdict });
  });
}
