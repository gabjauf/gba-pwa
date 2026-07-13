import { When, Then } from './fixtures';

When('I activate the {string} control', async ({ play }, control: string) => {
  await play.activate(control);
});

Then('the game is running', async ({ play }) => {
  await play.expectRunning();
});

Then('the {string} control is shown', async ({ play }, control: string) => {
  await play.expectControlShown(control);
});

Then('I am back on the home library', async ({ home }) => {
  await home.expectShown();
});
