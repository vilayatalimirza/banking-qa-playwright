import { buildPayee } from '../../data/factories';
import { test } from '../../fixtures/tracked';
import { accountById } from '../../pages/OverviewPage';
import { Checks } from '../../utils/checks';
import { observe } from '../../utils/findings';
import { toDecimalInput } from '../../utils/format';
import { trackPosts } from '../../utils/network';

// Double-submit: an impatient user clicks twice. A safe system applies the action exactly once.
// The UI may disable the button (a convenience), but only the server can truly guarantee it.

test(
  'double-clicking Transfer applies the transfer exactly once',
  { tag: ['@negative', '@idempotency'] },
  async ({ page, twoAccounts }) => {
    const { pages, sourceId, savingsId } = twoAccounts;
    const AMOUNT = 777; // $7.77

    await pages.overview.open();
    const before = await pages.overview.read(2);

    await pages.transfer.open();
    const posts = trackPosts(page, /transfer/i);
    await pages.transfer.fill(toDecimalInput(AMOUNT), sourceId, savingsId);
    await pages.transfer.submitTwice();
    await posts.settled();

    await pages.overview.open();
    const after = await pages.overview.read(2);
    const moved = accountById(before, sourceId).balanceCents - accountById(after, sourceId).balanceCents;

    await pages.overview.openAccount(sourceId);
    const debitRows = (await pages.details.activity()).filter((r) => r.debitCents === AMOUNT).length;

    const checks = new Checks();
    checks.check('INVARIANT', 'the bank total is unchanged', after.totalCents === before.totalCents, `before ${before.totalCents}, after ${after.totalCents}`);
    checks.check('REQUIREMENT', 'one user intent moves the money once', moved === AMOUNT, `moved ${moved}, intended ${AMOUNT}`);
    checks.check('REQUIREMENT', 'the statement shows exactly one debit', debitRows === 1, `${debitRows} debit rows`);

    observe('double-click-transfer', { postsSent: posts.sent, movedCents: moved, debitRows, verdict: checks.verdict });
  },
);

test(
  'double-clicking Send Payment pays the bill exactly once',
  { tag: ['@negative', '@idempotency'] },
  async ({ page, pages }) => {
    const AMOUNT = 1111; // $11.11

    await pages.overview.open();
    const before = await pages.overview.read(1);

    await pages.billPay.open();
    const posts = trackPosts(page, /billpay/i);
    await pages.billPay.fill(buildPayee(), toDecimalInput(AMOUNT), before.accounts[0].id);
    await pages.billPay.submitTwice();
    await posts.settled();

    await pages.overview.open();
    const after = await pages.overview.read(1);
    const moved = before.accounts[0].balanceCents - after.accounts[0].balanceCents;

    const checks = new Checks();
    checks.check('REQUIREMENT', 'one payment intent debits the account once', moved === AMOUNT, `moved ${moved}, intended ${AMOUNT}`);

    observe('double-click-billpay', { postsSent: posts.sent, movedCents: moved, verdict: checks.verdict });
  },
);

test(
  'double-clicking Open New Account creates exactly one account',
  { tag: ['@negative', '@idempotency'] },
  async ({ page, pages }) => {
    await pages.overview.open();
    const before = await pages.overview.read(1);
    const source = before.accounts[0];

    await pages.openAccount.open();
    const posts = trackPosts(page, /createAccount/i);
    await pages.openAccount.fill('SAVINGS', source.id);
    await pages.openAccount.submitTwice();
    await posts.settled();
    await page.waitForLoadState('networkidle'); // let any late request land before we count accounts

    await pages.overview.open();
    const after = await pages.overview.read();
    const newMoney = after.accounts
      .filter((a) => a.id !== source.id)
      .reduce((sum, a) => sum + a.balanceCents, 0);

    const checks = new Checks();
    checks.check('INVARIANT', 'opening accounts only moves money, the total is unchanged', after.totalCents === before.totalCents, `before ${before.totalCents}, after ${after.totalCents}`);
    checks.check('INVARIANT', 'the source lost exactly what the new accounts hold', source.balanceCents - (after.accounts.find((a) => a.id === source.id)?.balanceCents ?? 0) === newMoney, `new accounts hold ${newMoney}`);
    checks.check('REQUIREMENT', 'one user intent creates one account', after.accounts.length === 2, `${after.accounts.length} accounts now`);

    observe('double-click-open-account', { postsSent: posts.sent, accountsAfter: after.accounts.length, verdict: checks.verdict });
  },
);
