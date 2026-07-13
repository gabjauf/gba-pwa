import { Given, When, Then } from './fixtures';

Given('a ROM {string} is running', async ({ home, play }, _rom: string) => {
  await home.importRom();
  await play.expectRunning();
});

When('I import the ROM {string}', async ({ home }, _rom: string) => {
  await home.importRom();
});

Then('the library is empty', async ({ home }) => {
  await home.expectEmpty();
});

Then('the library lists {string}', async ({ home }, rom: string) => {
  await home.expectLibraryLists(rom);
});
