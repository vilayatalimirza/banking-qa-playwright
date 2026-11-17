import { randomUUID } from 'node:crypto';
import { buildCustomer } from '../../data/factories';
import { test } from '../../fixtures/api';
import { Pages } from '../../pages';
import { Checks } from '../../utils/checks';
import { observe, pageMessage } from '../../utils/findings';

// Cloudflare's edge-level 429/1015 page must not be mistaken for an application security control.
function isDemoRateLimit(status: number, body: string): boolean {
  const cloudflareBlock =
    /error\s*1015|you are being rate limited|attention required/i.test(body) ||
    (/cloudflare/i.test(body) && /rate.?limit|too many requests|temporarily blocked/i.test(body));

  return cloudflareBlock && [0, 200, 403, 429, 503].includes(status);
}

// Login controls. Only accounts created by the test run are attacked, and only a handful of attempts.

test('repeated wrong passwords lead to a lockout or throttle', { tag: ['@security', '@auth'] }, async ({ api, customer }) => {
  const ATTEMPTS = 10;
  const results: Array<{ status: number; text: string; ok: boolean }> = [];
  const durations: number[] = [];
  for (let i = 0; i < ATTEMPTS; i += 1) {
    const started = Date.now();
    const result = await api.login(customer.username, `wrong-password-${i}`);
    results.push(result);
    durations.push(Date.now() - started);
  }
  const correct = await api.login(customer.username, customer.password);

  test.skip(
    results.some((result) => isDemoRateLimit(result.status, result.text)) ||
      isDemoRateLimit(correct.status, correct.text),
    'Cloudflare rate-limited the login probe; this does not demonstrate account lockout',
  );

  const statuses = results.map((result) => result.status);
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
  test.skip(
    isDemoRateLimit(knownApi.status, knownApi.text) ||
      isDemoRateLimit(unknownApi.status, unknownApi.text),
    'Cloudflare rate-limited the API login comparison; user-enumeration result is inconclusive',
  );

  const visit = async (username: string): Promise<{ formShown: boolean; message: string; bodyText: string }> => {
    await pages.home.open();
    const formShown = await page
      .locator('input[name="username"]')
      .waitFor({ state: 'visible', timeout: 10_000 })
      .then(() => true, () => false);

    if (!formShown) {
      const bodyText = await page.locator('body').innerText().catch(() => '');
      return { formShown, message: `no login form at ${page.url()}`, bodyText };
    }

    await pages.home.attemptLogin(username, 'wrong-password');
    const bodyText = await page.locator('body').innerText().catch(() => '');
    return { formShown, message: await pageMessage(page), bodyText };
  };

  await pages.home.logout();
  const known = await visit(customer.username);
  const unknown = await visit(ghost);

  test.skip(
    isDemoRateLimit(200, known.bodyText) || isDemoRateLimit(200, unknown.bodyText),
    'Cloudflare blocked one of the UI login comparisons; user-enumeration result is inconclusive',
  );
  test.skip(
    !known.formShown || !unknown.formShown,
    'The login form was not available for both identities; the UI comparison cannot be made',
  );

  const knownUi = known.message;
  const unknownUi = unknown.message;
  const apiSame = knownApi.status === unknownApi.status && knownApi.text === unknownApi.text;
  const uiSame = knownUi === unknownUi;

  const checks = new Checks();
  checks.check('REQUIREMENT', 'the API answers identically for a known and an unknown username', apiSame, `known: HTTP ${knownApi.status} "${knownApi.text.slice(0, 60)}", unknown: HTTP ${unknownApi.status} "${unknownApi.text.slice(0, 60)}"`);
  checks.check('REQUIREMENT', 'the login page shows the same message for a known and an unknown username', uiSame, `known: "${knownUi}", unknown: "${unknownUi}"`);
  observe('user-enumeration', { apiSame, uiSame, uiComparable: true, knownUi, unknownUi, verdict: checks.verdict });
});

test('registration refuses a trivially weak password', { tag: ['@security', '@auth'] }, async ({ api, browser, baseURL }) => {
  const weak = buildCustomer({ password: '1' });
  const context = await browser.newContext({ baseURL });
  let registrationError = '';
  let registrationBody = '';
  let welcomeShown = false;

  try {
    const page = await context.newPage();
    const pages = new Pages(page);
    try {
      await pages.register.register(weak);
    } catch (error) {
      registrationError = error instanceof Error ? error.message : String(error);
    }

    registrationBody = await page.locator('body').innerText().catch(() => '');
    welcomeShown = await page
      .getByRole('heading', { name: `Welcome ${weak.username}`, exact: true })
      .isVisible()
      .catch(() => false);
  } finally {
    await context.close();
  }

  const registrationStatus = Number(/HTTP (\d{3})/i.exec(registrationError)?.[1] ?? 0);
  test.skip(
    isDemoRateLimit(registrationStatus, `${registrationError} ${registrationBody}`) ||
      isDemoRateLimit(200, registrationBody),
    'Cloudflare rate-limited registration; weak-password result is inconclusive',
  );

  // A successful API login proves the account was created with the weak password.
  const login = await api.login(weak.username, weak.password);
  test.skip(
    isDemoRateLimit(login.status, login.text),
    'Cloudflare rate-limited the login check; weak-password result is inconclusive',
  );

  const explicitPasswordRejection =
    /(password|passwd).{0,80}(weak|short|length|characters|minimum|required|invalid)|(weak|short|minimum).{0,50}password/i.test(registrationBody);

  if (!login.ok && !explicitPasswordRejection) {
    test.skip(
      true,
      `Registration outcome was inconclusive (welcome shown: ${welcomeShown}; response: ${registrationBody.slice(0, 180) || registrationError || 'no message'}; API login HTTP ${login.status})`,
    );
  }

  const checks = new Checks();
  checks.check('REQUIREMENT', 'a one-character password is refused', !login.ok, `account with password "1" can log in: ${login.ok}`);
  observe('weak-password', { accepted: login.ok, validationShown: explicitPasswordRejection, verdict: checks.verdict });
});
