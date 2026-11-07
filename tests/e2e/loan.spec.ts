import { expect, test } from '../../fixtures';
import { accountById } from '../../pages/OverviewPage';

interface LoanCase {
  title: string;
  loanCents: number;
  downPaymentCents: (balanceCents: number) => number;
  expectDenied: boolean;
}

const cases: LoanCase[] = [
  {
    title: 'small loan with a modest down payment',
    loanCents: 10000,
    downPaymentCents: () => 1000,
    expectDenied: false,
  },
  {
    title: 'down payment larger than the account balance',
    loanCents: 10000,
    downPaymentCents: (balance) => balance + 100000,
    expectDenied: true,
  },
];

for (const loanCase of cases) {
  test(
    `loan request (${loanCase.title}) leaves the books consistent with its outcome`,
    { tag: ['@regression'] },
    async ({ pages }) => {
      await pages.overview.open();
      const before = await pages.overview.read(1);
      const source = before.accounts[0];
      const downPayment = loanCase.downPaymentCents(source.balanceCents);

      await pages.loan.open();
      const result = await pages.loan.apply(loanCase.loanCents, downPayment, source.id);

      if (loanCase.expectDenied) {
        expect(result.status, 'a down payment above the balance must be denied').toBe('Denied');
      }

      await pages.overview.open();

      // The outcome itself is not what is tested here; consistency between outcome and
      // side effects is. (Package B turns observed rules into a proper decision table.)
      if (result.status === 'Approved') {
        const after = await pages.overview.read(2);
        expect(result.newAccountId, 'approval reports the new loan account').toBeDefined();
        expect(after.accounts.map((a) => a.id), 'new loan account is listed').toContain(
          result.newAccountId,
        );
        // Record what ParaBank actually did, so the business rule can be pinned down later.
        test.info().annotations.push({
          type: 'observed-approval',
          description:
            `source ${source.balanceCents} -> ${accountById(after, source.id).balanceCents} cents; ` +
            `loan account balance ${accountById(after, result.newAccountId ?? '').balanceCents} cents`,
        });
      } else {
        const after = await pages.overview.read(1);
        expect(after, 'a denied loan has no side effects at all').toEqual(before);
      }
    },
  );
}
