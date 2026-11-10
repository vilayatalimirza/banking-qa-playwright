import { test, expect } from '../../fixtures/api';
import { accountById } from '../../pages/OverviewPage';
import { shapeProblems } from '../../utils/shape';

// API contract + UI/API agreement. The customer is registered through the UI (the only way ParaBank offers).

test('API login returns the customer that was registered in the UI', { tag: ['@api'] }, async ({ api, customer }) => {
  const result = await api.login(customer.username, customer.password);
  expect(result.status, result.text).toBe(200);
  expect(shapeProblems(result.json, { id: 'number', firstName: 'string', lastName: 'string' })).toEqual([]);
  expect((result.json as { firstName: string }).firstName).toBe(customer.firstName);
});

test('API login with a wrong password is refused', { tag: ['@api', '@security'] }, async ({ api, customer }) => {
  const result = await api.login(customer.username, 'definitely-wrong');
  expect(result.ok, `expected a refusal, got HTTP ${result.status} ${result.text.slice(0, 100)}`).toBe(false);
});

test('account response has the documented shape', { tag: ['@api'] }, async ({ api, session }) => {
  const result = await api.getAccountRaw(session.sourceId);
  expect(result.status, result.text).toBe(200);
  expect(
    shapeProblems(result.json, { id: 'number', customerId: 'number', type: 'string', balance: 'number' }),
  ).toEqual([]);
});

test('the API and the Accounts Overview agree on every balance', { tag: ['@api', '@hybrid'] }, async ({ api, session, pages }) => {
  const apiAccounts = await api.accountsOf(session.customerId);
  await pages.overview.open();
  const ui = await pages.overview.read(apiAccounts.length);

  expect(ui.accounts.map((a) => a.id).sort()).toEqual(apiAccounts.map((a) => a.id).sort());
  for (const account of apiAccounts) {
    expect(accountById(ui, account.id).balanceCents, `balance of ${account.id}`).toBe(account.balanceCents);
  }
});
