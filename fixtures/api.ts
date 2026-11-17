import { ParaBankApi } from '../api/ParaBankApi';
import { buildCustomer } from '../data/factories';
import { test as tracked } from './tracked';

interface ApiSession {
  customerId: number;
  /** The checking account every new customer starts with. */
  sourceId: string;
}

interface ApiFixtures {
  /** An API client with NO session cookie (the Playwright `request` context is separate from setup). */
  api: ParaBankApi;
  /** A customer created through a separate setup context; test API calls remain anonymous. */
  session: ApiSession;
}

export const test = tracked.extend<ApiFixtures>({
  api: async ({ request }, use) => {
    await use(new ParaBankApi(request));
  },

  session: async ({ playwright, baseURL }, use) => {
    if (!baseURL) {
      throw new Error('A baseURL is required to create the API test customer');
    }

    // Customer creation/login uses its own cookie jar. The `api` fixture stays anonymous,
    // which is essential for the unauthenticated-access security tests.
    const setupContext = await playwright.request.newContext({ baseURL });
    try {
      const setupApi = new ParaBankApi(setupContext);
      const customer = buildCustomer();
      const customerId = await setupApi.registerCustomer(customer);
      const accounts = await setupApi.accountsOf(customerId);
      const checking = accounts.find((account) => account.type.toUpperCase() === 'CHECKING');
      if (!checking) {
        throw new Error(`New API customer ${customerId} has no checking account`);
      }

      await use({ customerId, sourceId: checking.id });
    } finally {
      await setupContext.dispose();
    }
  },
});

export { expect };
