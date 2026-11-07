import { expect, type Locator } from '@playwright/test';

/**
 * Checks that every locator a page object depends on matches exactly one element.
 * Uses soft assertions, so ONE run lists ALL broken locators instead of stopping at the first.
 */
export async function checkContract(contract: Record<string, Locator>): Promise<void> {
  for (const [name, locator] of Object.entries(contract)) {
    await expect.soft(locator, `contract: ${name}`).toHaveCount(1);
  }
}
