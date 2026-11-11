import { expect, test } from '@playwright/test';
import { axeScan } from '../../utils/a11y';

// Proves the scan helper really detects problems (and stays quiet on a clean page) without needing ParaBank.

test('axeScan reports a serious violation for an image without alternative text', async ({ page }) => {
  await page.setContent('<!doctype html><html lang="en"><head><title>t</title></head><body><main><h1>Hi</h1><img src="data:image/gif;base64,R0lGODlhAQABAAAAACw="></main></body></html>');
  const result = await axeScan(page);
  expect(result.serious).toBeGreaterThan(0);
  expect(result.seriousSummary).toContain('image-alt');
});

test('axeScan finds nothing serious on a clean page', async ({ page }) => {
  await page.setContent('<!doctype html><html lang="en"><head><title>t</title></head><body><main><h1>Hi</h1><img alt="logo" src="data:image/gif;base64,R0lGODlhAQABAAAAACw="></main></body></html>');
  const result = await axeScan(page);
  expect(result.serious).toBe(0);
  expect(result.seriousSummary).toBe('');
});
