import { test, expect } from '../../fixtures/api';
import { accountById } from '../../pages/OverviewPage';
import { toDecimalInput } from '../../utils/format';

// Hybrid pattern: set up or drive state through the fast API, then verify through the real UI (and the reverse).
// The two views of the same bank must always agree.

test('a transfer made through the API shows up in the UI overview and statement', { tag: ['@hybrid'] }, async ({ api, session, pages }) => {
  const AMOUNT = 2500; // $25.00
  const savings = await api.createAccount(session.customerId, 'SAVINGS', session.sourceId);
  const apiResult = await api.transfer(session.sourceId, savings.id, toDecimalInput(AMOUNT));
  expect(apiResult.status, apiResult.text).toBe(200);

  const apiSource = await api.balanceCents(session.sourceId);
  const apiSavings = await api.balanceCents(savings.id);

  await pages.overview.open();
  const ui = await pages.overview.read(2);
  expect(accountById(ui, session.sourceId).balanceCents, 'source balance in the UI').toBe(apiSource);
  expect(accountById(ui, savings.id).balanceCents, 'savings balance in the UI').toBe(apiSavings);

  await pages.overview.openAccount(session.sourceId);
  const rows = await pages.details.activity();
  expect(rows.filter((r) => r.debitCents === AMOUNT)).toHaveLength(1);
});

test('a transfer made in the UI is visible through the API', { tag: ['@hybrid'] }, async ({ api, twoAccounts }) => {
  const { pages, sourceId, savingsId } = twoAccounts;
  const AMOUNT = 1500; // $15.00

  await pages.transfer.open();
  await pages.transfer.transfer(AMOUNT, sourceId, savingsId);

  await pages.overview.open();
  const ui = await pages.overview.read(2);
  expect(await api.balanceCents(sourceId), 'source balance in the API').toBe(accountById(ui, sourceId).balanceCents);
  expect(await api.balanceCents(savingsId), 'savings balance in the API').toBe(accountById(ui, savingsId).balanceCents);

  const debits = (await api.transactions(sourceId)).filter((t) => /debit/i.test(t.type) && t.amountCents === AMOUNT);
  expect(debits, 'one debit of $15.00 in the API statement').toHaveLength(1);
});
