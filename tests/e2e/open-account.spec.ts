import { expect, test } from '../../fixtures';
import { accountById } from '../../pages/OverviewPage';

test(
  'opening a savings account moves money without creating or destroying any',
  { tag: ['@smoke', '@critical'] },
  async ({ pages }) => {
    // BEFORE: read everything from the screen. Never hard-code a starting balance:
    // ParaBank's seed balance differs between runs.
    await pages.overview.open();
    const before = await pages.overview.read(1);
    const source = before.accounts[0];

    await pages.openAccount.open();
    const newId = await pages.openAccount.openAccount('SAVINGS', source.id);

    // AFTER: waiting for exactly 2 rows proves the page has refreshed before we read it.
    await pages.overview.open();
    const after = await pages.overview.read(2);

    const newAccount = accountById(after, newId);
    const sourceAfter = accountById(after, source.id);
    const deposit = newAccount.balanceCents; // whatever ParaBank funded it with

    expect(deposit, 'the new account should be funded').toBeGreaterThan(0);
    expect(sourceAfter.balanceCents, 'source debited by exactly the deposit').toBe(
      source.balanceCents - deposit,
    );
    expect(after.totalCents, 'total unchanged: money moved, not created').toBe(before.totalCents);

    for (const account of after.accounts) {
      expect(account.availableCents, `available equals balance for ${account.id} (no holds)`).toBe(
        account.balanceCents,
      );
    }
  },
);
