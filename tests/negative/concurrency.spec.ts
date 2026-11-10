import { test } from '../../fixtures/tracked';
import { Pages } from '../../pages';
import { accountById } from '../../pages/OverviewPage';
import { Checks } from '../../utils/checks';
import { observe } from '../../utils/findings';
import { toDecimalInput } from '../../utils/format';

// Race condition: the same customer, in two sessions, sends two transfers at the same moment.
// Each transfer alone is affordable; together they are not. A safe system lets at most one through.
// Races are probabilistic: repeat with `--repeat-each=5` to raise the chance of catching one.

test(
  'two simultaneous transfers cannot overdraw one account',
  { tag: ['@negative', '@race'] },
  async ({ browser, baseURL, twoAccounts }) => {
    const { customer, pages: a, sourceId, savingsId } = twoAccounts;

    await a.overview.open();
    const before = await a.overview.read(2);
    const balance = accountById(before, sourceId).balanceCents;
    const amount = Math.floor(balance * 0.6); // 60% each: one fits, two do not
    const text = toDecimalInput(amount);

    // Session B: the same customer, logged in a second time in an isolated context.
    const contextB = await browser.newContext({ baseURL });
    try {
      const b = new Pages(await contextB.newPage());
      await b.home.open();
      await b.home.login(customer.username, customer.password);

      await Promise.all([a.transfer.open(), b.transfer.open()]);
      await Promise.all([
        a.transfer.fill(text, sourceId, savingsId),
        b.transfer.fill(text, sourceId, savingsId),
      ]);
      // Both clicks start together.
      const [outcomeA, outcomeB] = await Promise.all([
        a.transfer.clickAndObserve(),
        b.transfer.clickAndObserve(),
      ]);

      await a.overview.open();
      const after = await a.overview.read(2);
      const moved = balance - accountById(after, sourceId).balanceCents;
      const received =
        accountById(after, savingsId).balanceCents - accountById(before, savingsId).balanceCents;

      const checks = new Checks();
      checks.check('INVARIANT', 'the bank total is unchanged', after.totalCents === before.totalCents, `before ${before.totalCents}, after ${after.totalCents}`);
      checks.check('INVARIANT', 'what the source loses the destination gains', received === moved, `source -${moved}, destination +${received}`);
      checks.check('REQUIREMENT', 'concurrent transfers must not overdraw the account', accountById(after, sourceId).balanceCents >= 0, `source ended at ${accountById(after, sourceId).balanceCents}`);
      checks.check('REQUIREMENT', 'at most one of two unaffordable-together transfers applies', moved <= amount, `moved ${moved}, each was ${amount}`);

      observe('race-transfer', {
        amountEach: amount,
        statusA: outcomeA.status,
        statusB: outcomeB.status,
        movedCents: moved,
        sourceEnded: accountById(after, sourceId).balanceCents,
        verdict: checks.verdict,
      });
    } finally {
      await contextB.close();
    }
  },
);
