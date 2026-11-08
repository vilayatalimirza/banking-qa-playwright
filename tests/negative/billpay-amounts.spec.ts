import { buildPayee } from '../../data/factories';
import { test } from '../../fixtures';
import { Checks } from '../../utils/checks';
import { observe, pageMessage } from '../../utils/findings';
import { toDecimalInput } from '../../utils/format';

// Boundary-value analysis for the bill payment amount. A negative payment is the dangerous one:
// if accepted it would CREDIT the account, which means the bank created money.

interface AmountCase {
  name: string;
  text: (balanceCents: number) => string;
  outcome: 'reject' | 'accept';
  movedCents?: (balanceCents: number) => number;
  reason: string;
}

const cases: AmountCase[] = [
  { name: 'zero', text: () => '0', outcome: 'reject', reason: 'a zero-value payment is meaningless' },
  { name: 'negative amount', text: () => '-25.00', outcome: 'reject', reason: 'a negative payment would credit the account' },
  { name: 'sub-cent precision', text: () => '10.999', outcome: 'reject', reason: 'amounts finer than a cent must be refused, not silently rounded' },
  { name: 'non-numeric text', text: () => 'abc', outcome: 'reject', reason: 'text is not an amount' },
  { name: 'minimum unit (one cent)', text: () => '0.01', outcome: 'accept', movedCents: () => 1, reason: 'the smallest valid amount works' },
  { name: 'one cent above balance', text: (b) => toDecimalInput(b + 1), outcome: 'reject', reason: 'overdrawing by one cent must be refused' },
  { name: 'exactly the balance', text: (b) => toDecimalInput(b), outcome: 'accept', movedCents: (b) => b, reason: 'paying the full balance is allowed' },
];

for (const c of cases) {
  test(`bill pay amount: ${c.name}`, { tag: ['@negative'] }, async ({ page, pages }) => {
    await pages.overview.open();
    const before = await pages.overview.read(1);
    const source = before.accounts[0];
    const text = c.text(source.balanceCents);

    await pages.billPay.open();
    const submit = await pages.billPay.attempt(buildPayee(), text, source.id);
    const message = await pageMessage(page);

    await pages.overview.open();
    const after = await pages.overview.read(1);
    const moved = source.balanceCents - after.accounts[0].balanceCents;

    const checks = new Checks();
    checks.check('INVARIANT', 'a payment never credits the account', moved >= 0, `account moved ${moved}`);
    checks.check('INVARIANT', 'the bank total falls by exactly what the account lost', before.totalCents - after.totalCents === moved, `total fell ${before.totalCents - after.totalCents}, account lost ${moved}`);
    if (c.outcome === 'reject') {
      checks.check('REQUIREMENT', c.reason, moved === 0, `moved ${moved} cents`);
    } else {
      const expected = c.movedCents ? c.movedCents(source.balanceCents) : 0;
      checks.check('REQUIREMENT', c.reason, moved === expected, `moved ${moved}, expected ${expected}`);
    }

    observe('billpay-amount', {
      case: c.name,
      input: text,
      expected: c.outcome,
      requestSent: submit.requestSent,
      status: submit.status,
      movedCents: moved,
      message,
      verdict: checks.verdict,
    });
  });
}
