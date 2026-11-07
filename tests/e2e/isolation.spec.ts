import { expect, test } from '../../fixtures';

test(
  'two customers in separate sessions never see each other\'s accounts',
  { tag: ['@critical'] },
  async ({ pages, secondUser }) => {
    // Customer A (default context) and customer B (separate context) each have one account.
    await pages.overview.open();
    const a = await pages.overview.read(1);
    await secondUser.pages.overview.open();
    const b = await secondUser.pages.overview.read(1);

    const aIds = a.accounts.map((account) => account.id);
    const bIds = b.accounts.map((account) => account.id);
    for (const id of aIds) {
      expect(bIds, `B must not see A's account ${id}`).not.toContain(id);
    }

    // A opens another account. B's view must not change in any way.
    await pages.openAccount.open();
    await pages.openAccount.openAccount('SAVINGS', aIds[0]);

    await secondUser.pages.overview.open();
    const bAfter = await secondUser.pages.overview.read(1);
    expect(bAfter, "A's activity leaves B's accounts untouched").toEqual(b);
  },
);
