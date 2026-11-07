import { expect, test } from '../../fixtures';

test('a registered customer can log out and log back in', { tag: ['@smoke'] }, async ({
  page,
  pages,
  customer,
}) => {
  await pages.home.logout();
  await pages.home.login(customer.username, customer.password);

  await expect(page).toHaveURL(/overview\.htm/);
  await expect(page.getByRole('heading', { name: 'Accounts Overview' })).toBeVisible();
});
