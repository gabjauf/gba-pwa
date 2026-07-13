import { expect, type Page } from '@playwright/test';
import { ROM_PATH } from '../support/rom';

/** The home / library view: importing ROMs and the library list. */
export class HomeScreen {
  constructor(private readonly page: Page) {}

  private readonly fileInput = () => this.page.locator('.upload input[type=file]').first();

  /** A library entry, addressed by its ROM filename. */
  readonly rom = (name: string) => this.page.getByRole('button', { name });

  /** Import the test ROM; the app auto-launches it onto the play screen. */
  async importRom() {
    await this.fileInput().setInputFiles(ROM_PATH);
  }

  expectEmpty() {
    return expect(this.page.getByText('Your library is empty. Import a ROM.')).toBeVisible();
  }

  expectNoRoms() {
    return expect(this.page.locator('.rom')).toHaveCount(0);
  }

  expectLibraryLists(name: string) {
    return expect(this.rom(name)).toBeVisible();
  }

  /** We're back on the home library and can import again. */
  async expectShown() {
    await expect(this.page.getByRole('button', { name: 'Refresh library' })).toBeVisible();
    await expect(this.fileInput()).toBeAttached();
  }
}
