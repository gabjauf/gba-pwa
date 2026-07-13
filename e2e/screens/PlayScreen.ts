import { expect, type Page } from '@playwright/test';

/** The play view: the emulator canvas, the toolbar, and the load-state menu. */
export class PlayScreen {
  constructor(private readonly page: Page) {}

  private readonly canvas = () => this.page.locator('canvas.emulator-canvas');

  private readonly enabledSaveSlots = () =>
    this.page.locator(
      'select[aria-label="Load state"] optgroup[label="Slots"] option:not([disabled])'
    );

  /** Import auto-launches, so "running" == the canvas is on screen. */
  expectRunning() {
    return expect(this.canvas()).toBeVisible();
  }

  /** Toolbar controls: Pause / Resume / Reset / Quit / Save state. */
  activate(control: string) {
    return this.page.getByRole('button', { name: control }).click();
  }

  expectControlShown(control: string) {
    return expect(this.page.getByRole('button', { name: control })).toBeVisible();
  }

  expectNoSavedSlots() {
    return expect(this.enabledSaveSlots()).toHaveCount(0);
  }

  expectHasSavedSlot() {
    return expect(this.enabledSaveSlots().first()).toBeAttached();
  }
}
