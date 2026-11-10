import { test } from '../../fixtures/tracked';
import { accountById } from '../../pages/OverviewPage';
import { Checks } from '../../utils/checks';
import { observe, pageMessage } from '../../utils/findings';
import { toDecimalInput } from '../../utils/format';

// Boundary-value analysis for the transfer amount. Each case states what a bank is expected to do:
//  - 'reject': refuse the amount with NO side effects
//  - 'accept': move exactly `movedCents` and nothing else
// A red case means "ParaBank behaves differently from this requirement": a candidate defect to triage,
// not necessarily a bug in the test. Known defects are listed in data/known-defects.ts.

interface AmountCase {
  name: string;
  text: (balanceCents: number) => string;
  outcome: 'reject' | 'accept';
  movedCents?: (balanceCents: number) => number;
  reason: string;
  /** Zero amounts leave balances unchanged either way, so also check the statement for a recorded transaction. */
  checkStatement?: boolean;
}

const cases: AmountCase[] = [
  { name: 'zero', text: () => '0', outcome: 'reject', reason: 'a zero-value transfer is meaningless', checkStatement: true },
  { name: 'zero with decimals', text: () => '0.00', outcome: 'reject', reason: 'a zero-value transfer is meaningless', checkStatement: true },
  { name: 'minimum unit (one cent)', text: () => '0.01', outcome: 'accept', movedCents: () => 1, reason: 'the smallest valid amount works' },
  { name: 'one decimal place', text: () => '12.3', outcome: 'accept', movedCents: () => 1230, reason: '12.3 means 12.30' },
  { name: 'sub-cent precision', text: () => '10.999', outcome: 'reject', reason: 'amounts finer than a cent must be refused, not silently rounded' },
  { name: 'negative dollar', text: () => '-1.00', outcome: 'reject', reason: 'a negative amount would reverse the direction of the transfer' },
  { name: 'negative minimum unit', text: () => '-0.01', outcome: 'reject', reason: 'a negative amount would reverse the direction of the transfer' },
  { name: 'non-numeric text', text: () => 'abc', outcome: 'reject', reason: 'text is not an amount' },
  { name: 'empty', text: () => '', outcome: 'reject', reason: 'an amount is required' },
  { name: 'whitespace only', text: () => '   ', outcome: 'reject', reason: 'an amount is required' },
  { name: 'scientific notation', text: () => '1e2', outcome: 'reject', reason: 'scientific notation is not a money format' },
  { name: 'sql-like text', text: () => '1 OR 1=1', outcome: 'reject', reason: 'text is not an amount' },
  { name: 'one cent below balance', text: (b) => toDecimalInput(b - 1), outcome: 'accept', movedCents: (b) => b - 1, reason: 'just under the balance is affordable' },
  { name: 'exactly the balance', text: (b) => toDecimalInput(b), outcome: 'accept', movedCents: (b) => b, reason: 'draining the account exactly is allowed' },
  { name: 'one cent above balance', text: (b) => toDecimalInput(b + 1), outcome: 'reject', reason: 'overdrawing by one cent must be refused' },
  { name: 'one hundred times the balance', text: (b) => toDecimalInput(b * 100), outcome: 'reject', reason: 'a transfer far above the balance must be refused' },
  { name: 'huge value', text: () => '99999999999999999999.99', outcome: 'reject', reason: 'overflow-sized amounts must be refused' },
];

for (const c of cases) {
  test(`transfer amount: ${c.name}`, { tag: ['@negative'] }, async ({ page, twoAccounts }) => {
    const { pages, sourceId, savingsId } = twoAccounts;

    await pages.overview.open();
    const before = await pages.overview.read(2);
    const balance = accountById(before, sourceId).balanceCents;
    const text = c.text(balance);

    await pages.transfer.open();
    const submit = await pages.transfer.attempt(text, sourceId, savingsId);
    const message = await pageMessage(page); // capture before navigating away

    await pages.overview.open();
    const after = await pages.overview.read(2);
    const moved = balance - accountById(after, sourceId).balanceCents;
    const received =
      accountById(after, savingsId).balanceCents - accountById(before, savingsId).balanceCents;

    let zeroValueRows = 0;
    if (c.checkStatement) {
      await pages.overview.openAccount(sourceId);
      const rows = await pages.details.activity();
      zeroValueRows = rows.filter((r) => r.debitCents === 0 || r.creditCents === 0).length;
    }

    const checks = new Checks();
    // Invariants: true whatever the business rules are.
    checks.check('INVARIANT', 'an internal transfer never changes the bank total', after.totalCents === before.totalCents, `before ${before.totalCents}, after ${after.totalCents}`);
    checks.check('INVARIANT', 'what the source loses the destination gains', received === moved, `source -${moved}, destination +${received}`);
    checks.check('INVARIANT', 'a transfer never pulls money INTO the source', moved >= 0, `source moved ${moved}`);
    // A confirmation page must tell the truth: "Transfer Complete" with no money moved is a UI/ledger mismatch.
    // (Zero amounts legitimately move nothing; they are judged by their own rules above.)
    const claimedSuccess = /Transfer Complete/i.test(message);
    if (!c.name.startsWith('zero')) {
      checks.check('INVARIANT', 'a success confirmation means the money actually moved', !(claimedSuccess && moved === 0), `confirmation shown: ${claimedSuccess}, moved ${moved}`);
    }
    // Requirement: what a bank is expected to do with this input.
    if (c.outcome === 'reject') {
      checks.check('REQUIREMENT', c.reason, moved === 0, `moved ${moved} cents`);
    } else {
      const expected = c.movedCents ? c.movedCents(balance) : 0;
      checks.check('REQUIREMENT', c.reason, moved === expected, `moved ${moved}, expected ${expected}`);
    }
    if (c.checkStatement) {
      checks.check('REQUIREMENT', 'a zero-value transaction must not be recorded', zeroValueRows === 0, `${zeroValueRows} zero-value statement rows`);
    }

    observe('transfer-amount', {
      case: c.name,
      input: text,
      expected: c.outcome,
      requestSent: submit.requestSent,
      status: submit.status,
      movedCents: moved,
      zeroValueRows,
      message,
      verdict: checks.verdict,
    });
  });
}
