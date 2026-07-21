import { Given, When, Then } from './fixtures';

When('I activate the {string} control', async ({ play }, control: string) => {
  await play.activate(control);
});

Given('I am recording audio-resume calls', async ({ play }) => {
  await play.recordAudioResumes();
});

When('the app returns from the background', async ({ play }) => {
  await play.returnFromBackground();
});

Then('the emulator audio is resumed', async ({ play }) => {
  await play.expectAudioResumed();
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
