import { test } from '../../fixtures/tracked';
import type { Pages } from '../../pages';
import { accountById } from '../../pages/OverviewPage';
import { Checks } from '../../utils/checks';
import { observe } from '../../utils/findings';
import { toDecimalInput } from '../../utils/format';

// Failure simulation: break the network between the page and the bank and check money stays consistent.
// The glob matches both services/bank/transfer and services_proxy/bank/transfer.
const TRANSFER = '**/bank/transfer**';
const AMOUNT = 1000; // $10.00

async function snapshot(pages: Pages, sourceId: string, savingsId: string) {
  await pages.overview.open();
  const overview = await pages.overview.read(2);
  return {
    source: accountById(overview, sourceId).balanceCents,
    savings: accountById(overview, savingsId).balanceCents,
    total: overview.totalCents,
  };
}

async function debitRows(pages: Pages, sourceId: string): Promise<number> {
  await pages.overview.openAccount(sourceId);
  return (await pages.details.activity()).filter((r) => r.debitCents === AMOUNT).length;
}

test.describe('network failures', () => {
  test.setTimeout(90_000);

  test('connection cut before the server answers: no money moves, no false success', { tag: ['@resilience'] }, async ({ page, twoAccounts }) => {
    const { pages, sourceId, savingsId } = twoAccounts;
    const before = await snapshot(pages, sourceId, savingsId);

    await page.route(TRANSFER, (route) => route.abort('connectionfailed'));
    await pages.transfer.open();
    await pages.transfer.attempt(toDecimalInput(AMOUNT), sourceId, savingsId).catch(() => undefined);
    const successShown = (await page.getByRole('heading', { name: 'Transfer Complete!' }).count()) > 0;
    await page.unroute(TRANSFER);

    const after = await snapshot(pages, sourceId, savingsId);
    const checks = new Checks();
    checks.check('INVARIANT', 'the bank total is unchanged', after.total === before.total, `before ${before.total}, after ${after.total}`);
    checks.check('REQUIREMENT', 'nothing moved because the request never reached the bank', before.source - after.source === 0, `moved ${before.source - after.source}`);
    checks.check('REQUIREMENT', 'the UI must not claim success', !successShown, successShown ? 'success heading shown' : 'no success heading');
    observe('net-cut-before', { movedCents: before.source - after.source, successShown, verdict: checks.verdict });
  });

  test('offline: nothing moves and no success is shown', { tag: ['@resilience'] }, async ({ page, twoAccounts }) => {
    const { pages, sourceId, savingsId } = twoAccounts;
    const before = await snapshot(pages, sourceId, savingsId);

    await pages.transfer.open();
    await page.context().setOffline(true);
    await pages.transfer.attempt(toDecimalInput(AMOUNT), sourceId, savingsId).catch(() => undefined);
    const successShown = (await page.getByRole('heading', { name: 'Transfer Complete!' }).count()) > 0;
    await page.context().setOffline(false);

    const after = await snapshot(pages, sourceId, savingsId);
    const checks = new Checks();
    checks.check('REQUIREMENT', 'nothing moved while offline', before.source - after.source === 0, `moved ${before.source - after.source}`);
    checks.check('REQUIREMENT', 'the UI must not claim success while offline', !successShown, successShown ? 'success heading shown' : 'no success heading');
    observe('net-offline', { movedCents: before.source - after.source, successShown, verdict: checks.verdict });
  });

  test('server error 500: the UI shows no success and no money moves', { tag: ['@resilience'] }, async ({ page, twoAccounts }) => {
    const { pages, sourceId, savingsId } = twoAccounts;
    const before = await snapshot(pages, sourceId, savingsId);

    await page.route(TRANSFER, (route) =>
      route.fulfill({ status: 500, contentType: 'text/plain', body: 'Internal Server Error' }),
    );
    await pages.transfer.open();
    await pages.transfer.attempt(toDecimalInput(AMOUNT), sourceId, savingsId).catch(() => undefined);
    const successShown = (await page.getByRole('heading', { name: 'Transfer Complete!' }).count()) > 0;
    await page.unroute(TRANSFER);

    const after = await snapshot(pages, sourceId, savingsId);
    const checks = new Checks();
    checks.check('REQUIREMENT', 'nothing moved because the bank was never reached', before.source - after.source === 0, `moved ${before.source - after.source}`);
    checks.check('REQUIREMENT', 'the UI must not claim success on a 500', !successShown, successShown ? 'success heading shown' : 'no success heading');
    observe('net-500', { movedCents: before.source - after.source, successShown, verdict: checks.verdict });
  });

  test('slow server: one click still applies the transfer exactly once', { tag: ['@resilience'] }, async ({ page, twoAccounts }) => {
    const { pages, sourceId, savingsId } = twoAccounts;
    const before = await snapshot(pages, sourceId, savingsId);

    await page.route(TRANSFER, async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 3000)); // 3 seconds of latency
      await route.continue();
    });
    await pages.transfer.open();
    await pages.transfer.attempt(toDecimalInput(AMOUNT), sourceId, savingsId).catch(() => undefined);
    const successShown = (await page.getByRole('heading', { name: 'Transfer Complete!' }).count()) > 0;
    await page.unroute(TRANSFER);

    const after = await snapshot(pages, sourceId, savingsId);
    const checks = new Checks();
    checks.check('INVARIANT', 'the bank total is unchanged', after.total === before.total, `before ${before.total}, after ${after.total}`);
    checks.check('REQUIREMENT', 'latency does not change the result: exactly one transfer', before.source - after.source === AMOUNT, `moved ${before.source - after.source}`);
    checks.check('REQUIREMENT', 'the UI shows success once the slow answer arrives', successShown, successShown ? 'success heading shown' : 'no success heading');
    observe('net-slow', { movedCents: before.source - after.source, successShown, verdict: checks.verdict });
  });

  // The classic payments failure: the bank DID process the transfer but the answer was lost on the way back.
  // The user sees an error, retries, and pays twice unless the system can recognise the duplicate.
  test('response lost after the bank applied the transfer: a retry must not double charge', { tag: ['@resilience', '@idempotency'] }, async ({ page, twoAccounts }) => {
    const { pages, sourceId, savingsId } = twoAccounts;
    const before = await snapshot(pages, sourceId, savingsId);

    await page.route(TRANSFER, async (route) => {
      await route.fetch(); // the real request reaches the bank and is applied
      await route.abort('connectionreset'); // ...but the page never hears back
    });
    await pages.transfer.open();
    await pages.transfer.attempt(toDecimalInput(AMOUNT), sourceId, savingsId).catch(() => undefined);
    const successShown = (await page.getByRole('heading', { name: 'Transfer Complete!' }).count()) > 0;
    await page.unroute(TRANSFER);

    const afterLoss = await snapshot(pages, sourceId, savingsId);
    const debitsAfterLoss = await debitRows(pages, sourceId);

    // The user saw an error and tries again.
    await pages.transfer.open();
    await pages.transfer.attempt(toDecimalInput(AMOUNT), sourceId, savingsId).catch(() => undefined);
    const afterRetry = await snapshot(pages, sourceId, savingsId);
    const debitsAfterRetry = await debitRows(pages, sourceId);

    const movedByLoss = before.source - afterLoss.source;
    const movedByRetry = before.source - afterRetry.source;
    const checks = new Checks();
    checks.check('INVARIANT', 'the bank total is unchanged throughout', afterRetry.total === before.total, `before ${before.total}, after ${afterRetry.total}`);
    checks.check('INVARIANT', 'the statement records exactly what the bank did', debitsAfterLoss === (movedByLoss === AMOUNT ? 1 : 0), `moved ${movedByLoss}, ${debitsAfterLoss} debit rows`);
    checks.check('REQUIREMENT', 'a retry after a lost response must not double charge', movedByRetry <= AMOUNT, `moved ${movedByRetry} after the retry, one intent was ${AMOUNT}`);
    observe('net-response-lost', {
      uiShowedSuccess: successShown,
      bankAppliedFirstAttempt: movedByLoss === AMOUNT,
      movedAfterRetry: movedByRetry,
      debitRowsAfterRetry: debitsAfterRetry,
      verdict: checks.verdict,
    });
  });
});
