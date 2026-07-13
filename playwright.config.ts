import { defineConfig, devices } from '@playwright/test';
import { defineBddConfig } from 'playwright-bdd';

// Compile the Gherkin feature files into Playwright tests.
const testDir = defineBddConfig({
  features: 'e2e/features/**/*.feature',
  steps: 'e2e/steps/**/*.ts',
});

// Headless WebGL for the emulator canvas. Viewport is kept under 900px wide so
// the on-screen gamepad renders — it's hidden by a `(pointer: fine) and
// (min-width: 900px)` media query on desktop.
const chromium = {
  ...devices['Desktop Chrome'],
  viewport: { width: 800, height: 1000 },
  launchOptions: { args: ['--enable-unsafe-swiftshader'] },
};

export default defineConfig({
  testDir,
  timeout: 60_000,
  expect: { timeout: 20_000 },
  fullyParallel: false,
  workers: 1,
  reporter: 'list',
  projects: [
    {
      // Everything except offline runs against the dev server (localhost is a
      // secure context, so SharedArrayBuffer works with no cert).
      name: 'app',
      grepInvert: /@offline/,
      use: { ...chromium, baseURL: 'http://localhost:5173' },
    },
    {
      // Offline needs the real service worker, which only exists in a build.
      name: 'offline',
      grep: /@offline/,
      use: { ...chromium, baseURL: 'http://localhost:4173/gba-pwa/' },
    },
  ],
  webServer: [
    {
      command: 'npm run dev',
      url: 'http://localhost:5173',
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
    },
    {
      command: 'npm run build && npm run preview',
      url: 'http://localhost:4173/gba-pwa/',
      reuseExistingServer: !process.env.CI,
      timeout: 180_000,
    },
  ],
});
