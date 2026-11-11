import type { Page } from '@playwright/test';
import { test } from '../../fixtures/tracked';
import { Checks } from '../../utils/checks';
import { observe } from '../../utils/findings';

// How the login itself travels: does it reuse the session id, and are credentials kept out of URLs?

const sessionCookie = async (page: Page) =>
  (await page.context().cookies()).find((cookie) => cookie.name === 'JSESSIONID');

test('logging in issues a new session id (no session fixation)', { tag: ['@security', '@auth'] }, async ({ page, pages, customer }) => {
  await pages.home.logout();
  await pages.home.open();
  const before = (await sessionCookie(page))?.value;

  await pages.home.login(customer.username, customer.password);
  const after = (await sessionCookie(page))?.value;

  const checks = new Checks();
  checks.check('REQUIREMENT', 'the session id changes at login', before === undefined || before !== after, before === after ? 'same id before and after login' : 'id changed');
  observe('session-fixation', { idChanged: before !== after, hadIdBeforeLogin: before !== undefined, verdict: checks.verdict });
});

test('login sends credentials in a POST body and never in the URL', { tag: ['@security', '@auth'] }, async ({ page, pages, customer }) => {
  await pages.home.logout();
  await pages.home.open();

  const loginRequests: { method: string; url: string }[] = [];
  page.on('request', (request) => {
    if (/login\.htm/i.test(request.url())) {
      loginRequests.push({ method: request.method(), url: request.url() });
    }
  });
  await pages.home.login(customer.username, customer.password);

  const leaksPassword = loginRequests.some((r) => r.url.includes(customer.password));
  const allPost = loginRequests.length > 0 && loginRequests.every((r) => r.method === 'POST');

  const checks = new Checks();
  checks.check('INVARIANT', 'the password never appears in a URL', !leaksPassword, `${loginRequests.length} login requests`);
  checks.check('REQUIREMENT', 'the login form submits with POST', allPost, loginRequests.map((r) => r.method).join(','));
  observe('login-transport', { loginRequests: loginRequests.length, leaksPassword, allPost, verdict: checks.verdict });
});
