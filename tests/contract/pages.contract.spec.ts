import { test } from '../../fixtures';
import { checkContract } from '../../utils/contract';

// Run these FIRST (npx playwright test tests/contract). Each test opens a page and checks that
// every locator the page object depends on matches exactly one element. A failure here means
// "the page does not look the way our page object expects", which is different from "the
// behaviour is wrong", and one run lists every broken locator.

test.describe('page contracts', { tag: ['@contract'] }, () => {
  test('Accounts Overview', async ({ pages }) => {
    await pages.overview.open();
    await checkContract(pages.overview.contract);
  });

  test('Open New Account', async ({ pages }) => {
    await pages.openAccount.open();
    await checkContract(pages.openAccount.contract);
  });

  test('Transfer Funds', async ({ pages }) => {
    await pages.transfer.open();
    await checkContract(pages.transfer.contract);
  });

  test('Bill Pay', async ({ pages }) => {
    await pages.billPay.open();
    await checkContract(pages.billPay.contract);
  });

  test('Request Loan', async ({ pages }) => {
    await pages.loan.open();
    await checkContract(pages.loan.contract);
  });

  test('Update Contact Info', async ({ pages }) => {
    await pages.profile.open();
    await checkContract(pages.profile.contract);
  });

  test('Find Transactions', async ({ pages }) => {
    await pages.findTransactions.open();
    await checkContract(pages.findTransactions.contract);
  });
});
