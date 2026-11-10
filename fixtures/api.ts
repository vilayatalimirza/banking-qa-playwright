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
  /** The UI-registered customer, looked up through the API. Registration is the hybrid step: UI creates, API drives. */
  session: ApiSession;
}

export const test = tracked.extend<ApiFixtures>({
  api: async ({ request }, use) => {
    await use(new ParaBankApi(request));
  },

  session: async ({ api, customer }, use) => {
    const customerId = await api.customerIdFor(customer.username, customer.password);
    const accounts = await api.accountsOf(customerId);
    const first = accounts[0];
    if (!first) {
      throw new Error(`Customer ${customerId} has no accounts through the API`);
    }
    await use({ customerId, sourceId: first.id });
  },
});

export { expect };
