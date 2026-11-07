import { expect, test } from '../../fixtures';

test('an updated phone number is saved and shown when the page is reopened', { tag: ['@regression'] }, async ({
  pages,
}) => {
  const newPhone = '5550001111';

  await pages.profile.open();
  await pages.profile.updatePhone(newPhone);

  // Reopen the form from scratch: proves the value was persisted, not just echoed back.
  await pages.overview.open();
  await pages.profile.open();
  await expect(pages.profile.phone).toHaveValue(newPhone);
});
