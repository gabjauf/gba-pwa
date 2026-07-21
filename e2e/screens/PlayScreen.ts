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

  // --- Audio lifecycle (the dev-only __gbaEmulator seam) ------------------

  /** Spy on resumeAudio so we can assert the app wakes audio on foreground. */
  recordAudioResumes() {
    return this.page.evaluate(() => {
      const w = window as unknown as {
        __gbaEmulator: { resumeAudio: () => void };
        __audioResumes: number;
      };
      const emu = w.__gbaEmulator;
      w.__audioResumes = 0;
      const resume = emu.resumeAudio.bind(emu);
      emu.resumeAudio = () => (w.__audioResumes++, resume());
    });
  }

  /** Simulate the tab/PWA coming back to the foreground. */
  returnFromBackground() {
    return this.page.evaluate(() => document.dispatchEvent(new Event('visibilitychange')));
  }

  expectAudioResumed() {
    return expect
      .poll(() =>
        this.page.evaluate(() => (window as unknown as { __audioResumes: number }).__audioResumes)
      )
      .toBeGreaterThan(0);
  }

  expectNoSavedSlots() {
    return expect(this.enabledSaveSlots()).toHaveCount(0);
  }

  expectHasSavedSlot() {
    return expect(this.enabledSaveSlots().first()).toBeAttached();
  }
}
