import { expect, test } from '@playwright/test';
import { inspectDemoHome } from '../../utils/preflight';

test('accepts a successful ParaBank home page with a real Register link', () => {
  const result = inspectDemoHome(
    200,
    '<html><body><a href="register.htm">Register</a></body></html>',
  );

  expect(result).toEqual({ up: true, detail: 'HTTP 200; Register link present' });
});

test('rejects an HTTP 429 response even when its body mentions Register', () => {
  const result = inspectDemoHome(
    429,
    '<html><body>Register is temporarily unavailable</body></html>',
  );

  expect(result).toEqual({ up: false, detail: 'HTTP 429' });
});

test('rejects a challenge page that merely contains the word Register', () => {
  const result = inspectDemoHome(
    200,
    '<html><body>Security check. Register again later.</body></html>',
  );

  expect(result.up).toBe(false);
  expect(result.detail).toMatch(/no Register navigation link/);
});
