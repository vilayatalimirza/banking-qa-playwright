import { buildCustomer, buildPayee } from '../../data/factories';
import { expect, test } from '../../fixtures/api';
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
  async ({ page, anonymousPages }, testInfo) => {
    // Make the control fields explicit: this probe must fail only because of the SSN,
    // not because a required field was left blank by test data or a locator regression.
    const customer = buildCustomer({ firstName: 'QA', ssn: 'abc' });
    await anonymousPages.register.open();
    await anonymousPages.register.fillForm(customer);

    const firstNameField = page.getByRole('row').filter({ hasText: 'First Name:' }).getByRole('textbox');
    const ssnField = page.getByRole('row').filter({ hasText: 'SSN:' }).getByRole('textbox');
    await expect(firstNameField).toHaveValue(customer.firstName);
    await expect(ssnField).toHaveValue(customer.ssn);

    await anonymousPages.register.submit();

    const welcomeHeading = page.getByRole('heading', { name: `Welcome ${customer.username}`, exact: true });
    const welcomed = await expect(welcomeHeading)
      .toBeVisible({ timeout: 5000 })
      .then(() => true)
      .catch(() => false);

    const registrationFormVisible = await page
      .getByRole('heading', { name: 'Signing up is easy!' })
      .isVisible();
    const bodyText = await page.locator('body').innerText();
    const validationFeedback = bodyText
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => /\b(error|invalid|required|must be|please enter|cannot)\b/i.test(line))
      .slice(0, 3);
    const rejected = !welcomed && registrationFormVisible && validationFeedback.length > 0;

    observe('kyc-invalid-ssn', {
      accountCreated: welcomed,
      registrationFormVisible,
      validationFeedback: validationFeedback.join(' | ') || null,
      verdict: rejected ? 'REJECTED_WITH_VISIBLE_FEEDBACK' : welcomed ? 'INVALID_SSN_ACCEPTED' : 'INCONCLUSIVE',
    });

    // Mark only the demonstrated GAP-002 outcome as expected. A missing field, timeout,
    // challenge page or generic server error remains an ordinary unexpected failure.
    if (welcomed) {
      testInfo.fail(true, 'GAP-002: registration accepted SSN "abc" and created the customer');
    }

    expect(
      rejected,
      `Invalid SSN must remain on the registration form with visible validation feedback; found: ${validationFeedback.join(' | ') || 'no explicit validation message'}`,
    ).toBe(true);
  },
);
