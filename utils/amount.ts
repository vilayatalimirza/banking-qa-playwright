import { expect, type Locator } from '@playwright/test';
import { parseMoney } from './money';

// Per-attempt cap so one slow lookup cannot stall the whole polling loop.
const ATTEMPT_TIMEOUT_MS = 1000;

/** Returns the on-screen money in cents, or null while the element is missing or not money yet. */
async function readAmountOrNull(locator: Locator): Promise<number | null> {
  try {
    return parseMoney(await locator.innerText({ timeout: ATTEMPT_TIMEOUT_MS }));
  } catch {
    return null; // "Loading...", empty text, element not attached yet: keep polling
  }
}

/**
 * Retries until the amount shown in `locator` equals `expectedCents`, or the timeout passes.
 * Use this instead of a one-shot read right after a transfer.
 */
export async function expectAmount(
  locator: Locator,
  expectedCents: number,
  timeout = 5000,
): Promise<void> {
  await expect
    .poll(() => readAmountOrNull(locator), {
      timeout,
      message: 'on-screen amount (in cents) did not reach the expected value',
    })
    .toBe(expectedCents);
}

/**
 * Waits until the element contains a digit, then returns its amount in cents.
 * Throws if the text is not valid money (parseMoney is strict).
 */
export async function readAmount(locator: Locator): Promise<number> {
  await expect(locator).toHaveText(/\d/);
  return parseMoney(await locator.innerText());
}
