import { Given, When, Then } from './fixtures';
import type { ButtonLabel, Direction } from '../screens/Gamepad';

Given('I am recording button presses', async ({ gamepad }) => {
  await gamepad.recordPresses();
});

Given('the screen is landscape {int} by {int}', async ({ app }, w: number, h: number) => {
  await app.setViewport(w, h);
});

When('I press the D-pad towards {string}', async ({ gamepad }, direction: string) => {
  await gamepad.pressDpad(direction as Direction);
});

When('I press the {string} button', async ({ gamepad }, label: string) => {
  await gamepad.pressButton(label as ButtonLabel);
});

Then('the core receives a {string} press and release', async ({ gamepad }, button: string) => {
  await gamepad.expectPressThenRelease(button);
});

Then('the D-pad sits in the bottom-left', async ({ gamepad }) => {
  await gamepad.expectDpadBottomLeft();
});

Then('the action buttons sit in the bottom-right', async ({ gamepad }) => {
  await gamepad.expectActionsBottomRight();
});

Then('the control clusters do not overlap', async ({ gamepad }) => {
  await gamepad.expectClustersDoNotOverlap();
});
