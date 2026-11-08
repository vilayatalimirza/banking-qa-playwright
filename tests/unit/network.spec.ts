import { expect, test } from '@playwright/test';
import { trackPosts } from '../../utils/network';

// Local mock page: no ParaBank needed. A button fires a POST request when clicked.
const PAGE = `
<button id="pay">Pay</button>
<script>
  document.getElementById('pay').onclick = () =>
    fetch('https://mock.test/pay', { method: 'POST' });
</script>`;

test.beforeEach(async ({ page }) => {
  await page.route('https://mock.test/**', (route) =>
    route.fulfill({ status: 200, headers: { 'access-control-allow-origin': '*' }, body: 'ok' }),
  );
  await page.setContent(PAGE);
});

test('trackPosts sees both requests of a double click and waits for them to finish', async ({ page }) => {
  const posts = trackPosts(page, /mock\.test\/pay/);
  await page.getByRole('button', { name: 'Pay' }).dblclick();
  await posts.settled();
  expect(posts.sent).toBe(2);
});

test('trackPosts counts one request for one click', async ({ page }) => {
  const posts = trackPosts(page, /mock\.test\/pay/);
  await page.getByRole('button', { name: 'Pay' }).click();
  await posts.settled();
  expect(posts.sent).toBe(1);
});

test('trackPosts ignores requests that do not match the pattern', async ({ page }) => {
  const posts = trackPosts(page, /something-else/);
  await page.getByRole('button', { name: 'Pay' }).click();
  await posts.settled();
  expect(posts.sent).toBe(0);
});
