import { expect, test } from '@playwright/test';
import { expectAmount, readAmount } from '../../utils/amount';

// These tests use a tiny local HTML page, so they need no ParaBank access.

test('expectAmount retries until the text turns into the expected amount', async ({ page }) => {
  await page.setContent('<div id="bal">Loading...</div>');
  // Simulate an async balance update after a transfer.
  await page.evaluate(() => {
    setTimeout(() => { document.getElementById('bal')!.textContent = '$1015.50'; }, 600);
  });

  await expectAmount(page.locator('#bal'), 101550);
});

test('expectAmount waits for an element that appears late', async ({ page }) => {
  await page.setContent('<div id="box"></div>');
  await page.evaluate(() => {
    setTimeout(() => {
      document.getElementById('box')!.innerHTML = '<span id="bal">$90.00</span>';
    }, 600);
  });

  await expectAmount(page.locator('#bal'), 9000);
});

test('expectAmount fails with a clear message when the amount never matches', async ({ page }) => {
  await page.setContent('<div id="bal">$515.50</div>');

  await expect(expectAmount(page.locator('#bal'), 42, 1000)).rejects.toThrow(/amount/i);
});

test('readAmount returns cents once the text is present', async ({ page }) => {
  await page.setContent('<div id="bal"></div>');
  await page.evaluate(() => {
    setTimeout(() => { document.getElementById('bal')!.textContent = '$1,234.50'; }, 400);
  });

  expect(await readAmount(page.locator('#bal'))).toBe(123450);
});
