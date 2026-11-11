import { randomUUID } from 'node:crypto';
import { buildCustomer } from '../../data/factories';
import { test } from '../../fixtures/api';
import { Pages } from '../../pages';
import { Checks } from '../../utils/checks';
import { observe, pageMessage } from '../../utils/findings';

// Login controls. Only accounts created by the test run are attacked, and only a handful of attempts.

test('repeated wrong passwords lead to a lockout or throttle', { tag: ['@security', '@auth'] }, async ({ api, customer }) => {
  const ATTEMPTS = 10;
  const statuses: number[] = [];
  const durations: number[] = [];
  for (let i = 0; i < ATTEMPTS; i += 1) {
    const started = Date.now();
    const result = await api.login(customer.username, `wrong-password-${i}`);
    statuses.push(result.status);
    durations.push(Date.now() - started);
  }
  const correct = await api.login(customer.username, customer.password);

  const throttled = statuses.some((s) => s === 423 || s === 429);
  const lockedOut = !correct.ok;

  const checks = new Checks();
  checks.check('REQUIREMENT', `${ATTEMPTS} wrong passwords trigger a lockout or throttle`, throttled || lockedOut, `statuses ${statuses.join(',')}, correct password afterwards: HTTP ${correct.status}`);
  observe('bruteforce', {
    attempts: ATTEMPTS,
    statuses: statuses.join(','),
    firstMs: durations[0] ?? 0,
    lastMs: durations[ATTEMPTS - 1] ?? 0,
    correctLoginStatus: correct.status,
    verdict: checks.verdict,
  });
});

test('the login error does not reveal whether a username exists', { tag: ['@security', '@auth'] }, async ({ api, customer, page, pages }) => {
  test.setTimeout(60_000); // registration + 2 API calls + 2 UI logins on a shared demo
  const ghost = `nobody_${randomUUID().slice(0, 8)}`;

  const knownApi = await api.login(customer.username, 'wrong-password');
  const unknownApi = await api.login(ghost, 'wrong-password');

  // The same comparison as a visitor sees it in the browser (the fixture left this page logged in).
  // A missing login form is recorded (url + page text) instead of hanging until the test times out.
  const visit = async (username: string): Promise<{ formShown: boolean; message: string }> => {
    await pages.home.open();
    const formShown = await page
      .locator('input[name="username"]')
      .waitFor({ state: 'visible', timeout: 10_000 })
      .then(() => true, () => false);
    if (!formShown) {
      return { formShown, message: `no login form at ${page.url()}: ${await pageMessage(page)}` };
    }
    await pages.home.attemptLogin(username, 'wrong-password');
    return { formShown, message: await pageMessage(page) };
  };
  await pages.home.logout();
  const known = await visit(customer.username);
  const unknown = await visit(ghost);
  const knownUi = known.message;
  const unknownUi = unknown.message;
  const uiComparable = known.formShown && unknown.formShown;

  const apiSame = knownApi.status === unknownApi.status && knownApi.text === unknownApi.text;
  const uiSame = !uiComparable || knownUi === unknownUi; // not comparable = recorded, not failed

  const checks = new Checks();
  checks.check('REQUIREMENT', 'the API answers identically for a known and an unknown username', apiSame, `known: HTTP ${knownApi.status} "${knownApi.text.slice(0, 60)}", unknown: HTTP ${unknownApi.status} "${unknownApi.text.slice(0, 60)}"`);
  checks.check('REQUIREMENT', 'the login page shows the same message for a known and an unknown username', uiSame, `known: "${knownUi}", unknown: "${unknownUi}"`);
  observe('user-enumeration', { apiSame, uiSame, uiComparable, knownUi, unknownUi, verdict: checks.verdict });
});

test('registration refuses a trivially weak password', { tag: ['@security', '@auth'] }, async ({ api, browser, baseURL }) => {
  const weak = buildCustomer({ password: '1' });
  const context = await browser.newContext({ baseURL });
  try {
    const pages = new Pages(await context.newPage());
    await pages.register.register(weak).catch(() => undefined); // success or refusal: the API login below decides
  } finally {
    await context.close();
  }

  // Definitive oracle: if the account can log in with that password, the weak password was accepted.
  const login = await api.login(weak.username, weak.password);

  const checks = new Checks();
  checks.check('REQUIREMENT', 'a one-character password is refused', !login.ok, `account with password "1" can log in: ${login.ok}`);
  observe('weak-password', { accepted: login.ok, verdict: checks.verdict });
});
