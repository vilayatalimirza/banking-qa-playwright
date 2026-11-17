import { ParaBankApi } from '../api/ParaBankApi';
import { expect, test as tracked } from './tracked';

interface ApiSession {
  customerId: number;
  /** The checking account every new customer starts with. */
  sourceId: string;
}

interface ApiFixtures {
  /** An API client with NO session cookie (the Playwright `request` context is separate from the browser). */
  api: ParaBankApi;
  /** The UI-registered customer, mapped to the API through its first visible account (no second API login). */
  session: ApiSession;
}

export const test = tracked.extend<ApiFixtures>({
  api: async ({ request }, use) => {
    await use(new ParaBankApi(request));
  },

  session: async ({ api, pages }, use) => {
    // Registration leaves the browser logged in. Read the source account from the UI,
    // then resolve its owner through the account API instead of making another API login.
    await pages.overview.open();
    const overview = await pages.overview.read();
    const first = overview.accounts[0];
    if (!first) {
      throw new Error('The newly registered customer has no visible checking account');
    }

    const account = await api.account(first.id);
    const customerId = Number(account.customerId);
    if (!Number.isSafeInteger(customerId) || customerId <= 0) {
      throw new Error(`Account ${first.id} returned an invalid customer id: ${account.customerId}`);
    }

    await use({ customerId, sourceId: first.id });
  },
});

export { expect };
