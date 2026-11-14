import { test as base, expect } from '@playwright/test';
import { buildCustomer, type Customer } from '../data/factories';
import { Pages } from '../pages';

interface SecondUser {
  customer: Customer;
  pages: Pages;
}

interface TwoAccounts {
  customer: Customer;
  pages: Pages;
  /** The account every new customer starts with. */
  sourceId: string;
  /** A SAVINGS account opened from the source account. */
  savingsId: string;
}

interface Fixtures {
  /** A freshly registered customer. Registering also logs the browser in. */
  customer: Customer;
  /** Page objects for the logged-in customer's browser page. */
  pages: Pages;
  /** Page objects for a browser page with NO registration or login (for negative/auth tests). */
  anonymousPages: Pages;
  /** A second customer registered in a separate, isolated browser context. */
  secondUser: SecondUser;
  /** A logged-in customer who already owns two accounts (checking + savings). */
  twoAccounts: TwoAccounts;
}

export const test = base.extend<Fixtures>({
  customer: async ({ page }, use) => {
    const customer = buildCustomer();
    await new Pages(page).register.register(customer);
    await use(customer);
  },

  pages: async ({ page, customer }, use) => {
    // Listing `customer` as a dependency guarantees registration + login happen first.
    void customer;
    await use(new Pages(page));
  },

  anonymousPages: async ({ page }, use) => {
    await use(new Pages(page));
  },

  secondUser: async ({ browser, baseURL }, use) => {
    // A new context has its own cookies and storage, so it is a different "browser session".
    const context = await browser.newContext({ baseURL });
    const secondPages = new Pages(await context.newPage());
    const customer = buildCustomer();
    await secondPages.register.register(customer);
    await use({ customer, pages: secondPages });
    await context.close();
  },

  twoAccounts: async ({ pages, customer }, use) => {
    await pages.overview.open();
    const initial = await pages.overview.read(1);
    const sourceId = initial.accounts[0].id;

    await pages.openAccount.open();
    const savingsId = await pages.openAccount.openAccount('SAVINGS', sourceId);

    await use({ customer, pages, sourceId, savingsId });
  },
});

export { expect };
