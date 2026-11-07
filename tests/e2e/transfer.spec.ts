import { expect, test } from '../../fixtures';
import { accountById } from '../../pages/OverviewPage';

const TRANSFER_CENTS = 1234; // $12.34: distinctive, so it cannot be confused with another amount

test(
  'a transfer moves exactly the amount between own accounts and shows on both statements',
  { tag: ['@smoke', '@critical'] },
  async ({ pages }) => {
    // Setup through the UI for now (Package C moves this to the API for speed).
    await pages.overview.open();
    const initial = await pages.overview.read(1);
    const sourceId = initial.accounts[0].id;

    await pages.openAccount.open();
    const savingsId = await pages.openAccount.openAccount('SAVINGS', sourceId);

    await pages.overview.open();
    const before = await pages.overview.read(2);
    const sourceBefore = accountById(before, sourceId);
    const savingsBefore = accountById(before, savingsId);
    expect(sourceBefore.balanceCents, 'precondition: source can afford the transfer').toBeGreaterThan(
      TRANSFER_CENTS,
    );

    await pages.transfer.open();
    await pages.transfer.transfer(TRANSFER_CENTS, sourceId, savingsId);

    // Balances: exact cents on both sides, and the total is conserved.
    await pages.overview.open();
    const after = await pages.overview.read(2);
    expect(accountById(after, sourceId).balanceCents, 'source debited').toBe(
      sourceBefore.balanceCents - TRANSFER_CENTS,
    );
    expect(accountById(after, savingsId).balanceCents, 'destination credited').toBe(
      savingsBefore.balanceCents + TRANSFER_CENTS,
    );
    expect(after.totalCents, 'total unchanged').toBe(before.totalCents);

    // Both legs of the transfer appear on the statements.
    await pages.overview.openAccount(sourceId);
    const sourceActivity = await pages.details.activity();
    expect(sourceActivity.map((row) => row.debitCents), 'source statement shows the debit').toContain(
      TRANSFER_CENTS,
    );

    await pages.overview.open();
    await pages.overview.openAccount(savingsId);
    const savingsActivity = await pages.details.activity();
    expect(savingsActivity.map((row) => row.creditCents), 'destination statement shows the credit').toContain(
      TRANSFER_CENTS,
    );
  },
);
