import { buildCustomer, buildPayee } from '../../data/factories';
import { test } from '../../fixtures/api';
import { Checks } from '../../utils/checks';
import { observe } from '../../utils/findings';

// Regulatory controls a real bank must have. ParaBank is a demo, so some of these are expected gaps (GAP-xxx):
// the value is showing HOW you would test the control, and recording the gap.

test(
  'PSD2 SCA: a payment above the exemption limit needs a second factor',
  { tag: ['@compliance', '@sca', '@api'] },
  async ({ api, session }) => {
    const before = await api.balanceCents(session.sourceId);

    // $100 is above the EUR 30 contactless-style exemption and is a remote electronic payment: SCA applies.
    // We send the payment with only the existing session/identity and no one-time code or challenge.
    const result = await api.billPay(session.sourceId, '100.00', buildPayee());
    const moved = before - (await api.balanceCents(session.sourceId));

    const checks = new Checks();
    checks.check(
      'REQUIREMENT',
      'a $100 remote payment is not completed without a second factor',
      !(result.ok && moved === 10000),
      `HTTP ${result.status}, moved ${moved} with no challenge`,
    );
    observe('sca-gap', { status: result.status, movedCents: moved, verdict: checks.verdict });
  },
);

test(
  'KYC: registration refuses an obviously invalid SSN',
  { tag: ['@compliance', '@kyc', '@negative'] },
  async ({ page, anonymousPages }) => {
    const customer = buildCustomer({ ssn: 'abc' });
    await anonymousPages.register.open();
    await anonymousPages.register.fillForm(customer);
    await anonymousPages.register.submit();

    const welcomed = await page
      .getByRole('heading', { name: `Welcome ${customer.username}`, exact: true })
      .isVisible({ timeout: 5000 })
      .catch(() => false);

    const checks = new Checks();
    checks.check('REQUIREMENT', 'an invalid SSN does not create a customer', !welcomed, welcomed ? 'account created with SSN "abc"' : 'refused');
    observe('kyc-invalid-ssn', { accountCreated: welcomed, verdict: checks.verdict });
  },
);
