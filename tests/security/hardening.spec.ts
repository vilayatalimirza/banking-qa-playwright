import { expect, test } from '../../fixtures/tracked';
import { Checks } from '../../utils/checks';
import { observe } from '../../utils/findings';

// Browser-side hardening: response headers, cookie flags, caching, exposed admin console. Read-only checks.

test('the login page sends the standard security headers', { tag: ['@security'] }, async ({ request }) => {
  const response = await request.get('index.htm');
  const h = response.headers(); // names are lower-case
  const csp = h['content-security-policy'] ?? '';

  const checks = new Checks();
  checks.check('REQUIREMENT', 'X-Content-Type-Options is nosniff', h['x-content-type-options'] === 'nosniff', `value: ${h['x-content-type-options'] ?? 'missing'}`);
  checks.check('REQUIREMENT', 'clickjacking protection (X-Frame-Options or CSP frame-ancestors)', Boolean(h['x-frame-options']) || /frame-ancestors/i.test(csp), `x-frame-options: ${h['x-frame-options'] ?? 'missing'}`);
  checks.check('REQUIREMENT', 'a Content-Security-Policy is set', csp !== '', `value: ${csp || 'missing'}`);
  checks.check('REQUIREMENT', 'Strict-Transport-Security is set', Boolean(h['strict-transport-security']), `value: ${h['strict-transport-security'] ?? 'missing'}`);
  checks.check('REQUIREMENT', 'a Referrer-Policy is set', Boolean(h['referrer-policy']), `value: ${h['referrer-policy'] ?? 'missing'}`);
  checks.check('REQUIREMENT', 'the server does not disclose its version', !/\d/.test(h['server'] ?? '') && !h['x-powered-by'], `server: ${h['server'] ?? 'n/a'}, x-powered-by: ${h['x-powered-by'] ?? 'n/a'}`);
  observe('security-headers', {
    status: response.status(),
    nosniff: h['x-content-type-options'] ?? 'missing',
    xFrameOptions: h['x-frame-options'] ?? 'missing',
    csp: csp ? 'set' : 'missing',
    hsts: h['strict-transport-security'] ?? 'missing',
    referrerPolicy: h['referrer-policy'] ?? 'missing',
    server: h['server'] ?? 'n/a',
    verdict: checks.verdict,
  });
});

test('the session cookie carries the protective flags', { tag: ['@security'] }, async ({ page, pages }) => {
  await pages.overview.open();
  const cookies = await page.context().cookies();
  const session = cookies.find((c) => /jsessionid/i.test(c.name));
  expect(session, `a session cookie exists (cookies: ${cookies.map((c) => c.name).join(',')})`).toBeDefined();

  const checks = new Checks();
  checks.check('REQUIREMENT', 'the session cookie is HttpOnly (not readable by scripts)', session?.httpOnly === true, `httpOnly: ${session?.httpOnly}`);
  checks.check('REQUIREMENT', 'the session cookie is Secure (sent only over HTTPS)', session?.secure === true, `secure: ${session?.secure}`);
  checks.check('REQUIREMENT', 'the session cookie sets SameSite Lax or Strict', session?.sameSite === 'Lax' || session?.sameSite === 'Strict', `sameSite: ${session?.sameSite}`);
  observe('session-cookie', { name: session?.name ?? 'none', httpOnly: session?.httpOnly ?? false, secure: session?.secure ?? false, sameSite: session?.sameSite ?? 'none', verdict: checks.verdict });
});

test('signed-in pages are not cacheable', { tag: ['@security'] }, async ({ page, pages }) => {
  await pages.overview.open();
  const response = await page.request.get('overview.htm'); // same cookies as the signed-in page
  const cacheControl = response.headers()['cache-control'] ?? 'missing';

  const checks = new Checks();
  checks.check('REQUIREMENT', 'account pages send Cache-Control no-store (or no-cache)', /no-store|no-cache/i.test(cacheControl), `cache-control: ${cacheControl}`);
  observe('cache-control', { status: response.status(), cacheControl, verdict: checks.verdict });
});

// Read-only: the page is only LOOKED AT. Never click its buttons: they reset the shared demo database.
test('the admin console is not reachable by an anonymous visitor', { tag: ['@security'] }, async ({ page }) => {
  await page.goto('admin.htm');
  const bodyText = await page.locator('body').innerText();
  const adminShown = /Administration|Data Access Mode|Initialize/i.test(bodyText);

  const checks = new Checks();
  checks.check('REQUIREMENT', 'admin.htm needs authentication', !adminShown, `admin content visible to an anonymous visitor: ${adminShown}`);
  observe('admin-console', { adminShown, url: page.url(), verdict: checks.verdict });
});
