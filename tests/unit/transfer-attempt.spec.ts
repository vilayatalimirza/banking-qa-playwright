import { expect, test } from '@playwright/test';
import { TransferPage } from '../../pages/TransferPage';

// Local mock of the transfer form: proves TransferPage.attempt() tells apart
// "server accepted", "server rejected" and "page blocked the input before sending anything".
const FORM = `
<input id="amount">
<select id="fromAccountId"><option value="111">111</option></select>
<select id="toAccountId"><option value="222">222</option></select>
<input type="button" value="Transfer" id="go">
<script>
  document.getElementById('go').onclick = () => {
    const value = document.getElementById('amount').value;
    if (value === 'blocked') return; // client-side validation: no request is sent
    fetch('https://mock.test/services_proxy/bank/transfer?amount=' + encodeURIComponent(value), { method: 'POST' });
  };
</script>`;

async function mockPage(page: import('@playwright/test').Page, status: number): Promise<TransferPage> {
  await page.route('https://mock.test/**', (route) =>
    route.fulfill({ status, headers: { 'access-control-allow-origin': '*' }, body: 'x' }),
  );
  await page.setContent(FORM);
  return new TransferPage(page);
}

test('attempt reports the status when the server accepts the transfer', async ({ page }) => {
  const transfer = await mockPage(page, 200);
  expect(await transfer.attempt('5.00', '111', '222')).toEqual({ requestSent: true, status: 200 });
});

test('attempt reports the status when the server rejects the transfer', async ({ page }) => {
  const transfer = await mockPage(page, 400);
  expect(await transfer.attempt('abc', '111', '222')).toEqual({ requestSent: true, status: 400 });
});

test('attempt reports that nothing was sent when the page blocks the input', async ({ page }) => {
  const transfer = await mockPage(page, 200);
  expect(await transfer.attempt('blocked', '111', '222')).toEqual({ requestSent: false, status: null });
});
