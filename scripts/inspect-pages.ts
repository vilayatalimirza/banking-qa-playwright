import { chromium } from '@playwright/test';
import { buildCustomer } from '../data/factories';
import { Pages } from '../pages';

// Diagnostic: prints what the real pages look like (form controls, headings, messages) so page objects can be fixed from facts.
//   npx tsx scripts/inspect-pages.ts
const BASE = process.env.BASE_URL ?? 'https://parabank.parasoft.com/parabank/';

async function main(): Promise<void> {
  const browser = await chromium.launch();
  const context = await browser.newContext({ baseURL: BASE });
  const page = await context.newPage();
  page.setDefaultTimeout(20_000);
  const customer = buildCustomer();
  await new Pages(page).register.register(customer);
  console.log(`registered ${customer.username}`);

  const controls = async (label: string): Promise<void> => {
    const found = await page.evaluate(() =>
      Array.from(document.querySelectorAll('#rightPanel input, #rightPanel select, #rightPanel button, #rightPanel h1, #rightPanel h2')).map((el) => {
        const e = el as HTMLInputElement;
        return `${el.tagName.toLowerCase()} id="${e.id}" name="${e.name ?? ''}" type="${e.type ?? ''}" value="${(e.value ?? '').slice(0, 20)}" text="${(el.textContent ?? '').trim().slice(0, 40)}" visible=${(el as HTMLElement).offsetParent !== null}`;
      }),
    );
    console.log(`\n=== ${label} (${page.url()}) ===\n${found.join('\n')}`);
  };

  await page.getByRole('link', { name: 'Find Transactions' }).click();
  await page.waitForLoadState('networkidle').catch(() => undefined);
  await controls('Find Transactions');

  await page.getByRole('link', { name: 'Bill Pay' }).click();
  await page.waitForLoadState('networkidle').catch(() => undefined);
  await controls('Bill Pay');

  await page.getByRole('link', { name: 'Update Contact Info' }).click();
  await page.waitForLoadState('networkidle').catch(() => undefined);
  await controls('Update Contact Info (before)');
  const phone = page.getByRole('row').filter({ hasText: 'Phone #:' }).getByRole('textbox');
  await phone.fill('5550001111');
  await page.getByRole('button', { name: 'Update Profile', exact: true }).click();
  await page.waitForTimeout(4000);
  console.log(`\n=== after Update Profile (${page.url()}) ===\n${((await page.locator('#rightPanel').innerText().catch(() => '')) || (await page.locator('body').innerText())).replace(/\s+/g, ' ').slice(0, 400)}`);
  await browser.close();
}

main().catch((error: unknown) => {
  console.error('inspect failed:', error instanceof Error ? error.message : error);
  process.exit(1);
});
