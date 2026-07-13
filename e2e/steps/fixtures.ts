import { test as base, createBdd } from 'playwright-bdd';
import { App } from '../screens/App';
import { HomeScreen } from '../screens/HomeScreen';
import { PlayScreen } from '../screens/PlayScreen';
import { Gamepad } from '../screens/Gamepad';

type Fixtures = {
  app: App;
  home: HomeScreen;
  play: PlayScreen;
  gamepad: Gamepad;
  /** Console errors + uncaught page errors collected across the scenario. */
  consoleErrors: string[];
};

export const test = base.extend<Fixtures>({
  app: async ({ page }, use) => use(new App(page)),
  home: async ({ page }, use) => use(new HomeScreen(page)),
  play: async ({ page }, use) => use(new PlayScreen(page)),
  gamepad: async ({ page }, use) => use(new Gamepad(page)),
  consoleErrors: async ({ page }, use) => {
    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text());
    });
    page.on('pageerror', (err) => errors.push(String(err)));
    await use(errors);
  },
});

export const { Given, When, Then } = createBdd(test);
