import { buildPayee } from '../../data/factories';
import { expect, test } from '../../fixtures';

const PAYMENT_CENTS = 2500; // $25.00

test(
  'paying a bill debits the account by exactly the payment and the bank total drops by the same amount',
  { tag: ['@smoke'] },
  async ({ page, pages }) => {
    await pages.overview.open();
    const before = await pages.overview.read(1);
    const source = before.accounts[0];
    expect(source.balanceCents, 'precondition: account can afford the payment').toBeGreaterThan(
      PAYMENT_CENTS,
    );

    const payee = buildPayee();
    await pages.billPay.open();
    await pages.billPay.pay(payee, PAYMENT_CENTS, source.id);

    // Soft: a wording problem on the confirmation must not hide the money checks below.
    await expect.soft(page.getByText(payee.name), 'confirmation names the payee').toBeVisible();

    await pages.overview.open();
    const after = await pages.overview.read(1);

    expect(after.accounts[0].balanceCents, 'account debited').toBe(source.balanceCents - PAYMENT_CENTS);
    // An external payment is an OUTFLOW from the bank, so the total falls by exactly the amount
    // (unlike an internal transfer, where the total is unchanged).
    expect(after.totalCents, 'total falls by the payment').toBe(before.totalCents - PAYMENT_CENTS);
  },
);
