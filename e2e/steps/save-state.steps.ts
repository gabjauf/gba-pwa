import { Given, Then } from './fixtures';

Given('no save slots are filled', async ({ play }) => {
  await play.expectNoSavedSlots();
});

Then('a save slot is filled', async ({ play }) => {
  await play.expectHasSavedSlot();
});
