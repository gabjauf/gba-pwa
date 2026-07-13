import { expect, type Page } from '@playwright/test';

/** App-level concerns: navigation, core readiness, isolation, offline. */
export class App {
  constructor(private readonly page: Page) {}

  /** The "Refresh library" button is disabled until the mGBA core has booted. */
  private readonly refreshButton = () =>
    this.page.getByRole('button', { name: 'Refresh library' });

  async open() {
    await this.page.goto('/');
  }

  /** The production build served under its own base path (offline suite). */
  async openBuilt() {
    await this.page.goto('./');
  }

  waitForCoreReady() {
    return expect(this.refreshButton()).toBeEnabled();
  }

  async reload() {
    await this.page.reload();
    await this.waitForCoreReady();
  }

  isCrossOriginIsolated() {
    return this.page.evaluate(() => globalThis.crossOriginIsolated);
  }

  hasSharedArrayBuffer() {
    return this.page.evaluate(() => typeof SharedArrayBuffer !== 'undefined');
  }

  setViewport(width: number, height: number) {
    return this.page.setViewportSize({ width, height });
  }

  goOffline() {
    return this.page.context().setOffline(true);
  }

  waitForServiceWorker() {
    return this.page.waitForFunction(() => navigator.serviceWorker?.controller != null, null, {
      timeout: 30_000,
    });
  }
}
