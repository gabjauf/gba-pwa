import { expect } from '@playwright/test';
import { Given, When, Then } from './fixtures';

// Console noise expected on the dev server: cross-origin isolation comes from
// response headers, so the coi service worker fails to register (its script is
// served as HTML by the SPA fallback). None of it affects the app.
const BENIGN_ERROR = /coi-sw\.js|Service Worker|unsupported MIME type/i;

Given('I open the app', async ({ app }) => {
  await app.open();
});

Given('the core is ready', async ({ app }) => {
  await app.open();
  await app.waitForCoreReady();
});

Given('I open the built app', async ({ app }) => {
  await app.openBuilt();
});

Given('the service worker is in control', async ({ app }) => {
  await app.waitForServiceWorker();
  await app.waitForCoreReady();
});

When('I reload the app', async ({ app }) => {
  await app.reload();
});

When('I go offline', async ({ app }) => {
  await app.goOffline();
});

Then('the app is ready', async ({ app }) => {
  await app.waitForCoreReady();
});

Then('the page is cross-origin isolated', async ({ app }) => {
  expect(await app.isCrossOriginIsolated()).toBe(true);
});

Then('SharedArrayBuffer is available', async ({ app }) => {
  expect(await app.hasSharedArrayBuffer()).toBe(true);
});

Then('no errors were printed to the console', ({ consoleErrors }) => {
  expect(consoleErrors.filter((e) => !BENIGN_ERROR.test(e))).toEqual([]);
});
