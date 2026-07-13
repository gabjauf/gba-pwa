import { expect, type Locator, type Page } from '@playwright/test';

export type Direction = 'up' | 'down' | 'left' | 'right';
export type ButtonLabel = 'A' | 'B' | 'L' | 'R' | 'Select' | 'Start';
type Press = [action: 'press' | 'release', button: string];

// The D-pad and A/B pad are geometric: the visible buttons are inert and the
// pressed direction/button is derived from where the pointer lands. So we
// dispatch a real pointer press+release at a point rather than clicking.
const BUTTON_SELECTOR: Record<ButtonLabel, string> = {
  A: '.action.a',
  B: '.action.b',
  L: '.shoulder.left',
  R: '.shoulder.right',
  Select: '.meta button:has-text("Select")',
  Start: '.meta button:has-text("Start")',
};

/** The on-screen touch controls. */
export class Gamepad {
  constructor(private readonly page: Page) {}

  private readonly dpad = () => this.page.getByLabel('D-pad');
  private readonly actions = () => this.page.getByLabel('Action buttons');

  /** Press the D-pad toward a direction, 35% of the way out from its centre. */
  async pressDpad(direction: Direction) {
    const box = await boxOf(this.dpad());
    const reach = Math.min(box.width, box.height) * 0.35;
    const c = centre(box);
    const point = {
      right: { x: c.x + reach, y: c.y },
      left: { x: c.x - reach, y: c.y },
      up: { x: c.x, y: c.y - reach },
      down: { x: c.x, y: c.y + reach },
    }[direction];
    await this.tap(point.x, point.y);
  }

  /** Press any labelled button (A, B, L, R, Select, Start) at its centre. */
  async pressButton(label: ButtonLabel) {
    const c = centre(await boxOf(this.page.locator(BUTTON_SELECTOR[label])));
    await this.tap(c.x, c.y);
  }

  private async tap(x: number, y: number) {
    await this.page.mouse.move(x, y);
    await this.page.mouse.down();
    await this.page.mouse.up();
  }

  // --- Press recording (the dev-only __gbaEmulator seam) ------------------

  recordPresses() {
    return this.page.evaluate(() => {
      const w = window as unknown as {
        __gbaEmulator: { buttonPress: (k: string) => void; buttonUnpress: (k: string) => void };
        __presses: Press[];
      };
      const emu = w.__gbaEmulator;
      w.__presses = [];
      const press = emu.buttonPress.bind(emu);
      const unpress = emu.buttonUnpress.bind(emu);
      emu.buttonPress = (k) => (w.__presses.push(['press', k]), press(k));
      emu.buttonUnpress = (k) => (w.__presses.push(['release', k]), unpress(k));
    });
  }

  expectPressThenRelease(button: string) {
    return expect
      .poll(() => this.page.evaluate(() => (window as unknown as { __presses: Press[] }).__presses))
      .toEqual([
        ['press', button],
        ['release', button],
      ]);
  }

  // --- Landscape placement ------------------------------------------------

  async expectDpadBottomLeft() {
    await expectInQuadrant(this.page, this.dpad(), 'left', 'D-pad');
  }

  async expectActionsBottomRight() {
    await expectInQuadrant(this.page, this.actions(), 'right', 'action buttons');
  }

  async expectClustersDoNotOverlap() {
    const dpad = await boxOf(this.dpad());
    const actions = await boxOf(this.actions());
    const overlaps =
      dpad.x < actions.x + actions.width &&
      dpad.x + dpad.width > actions.x &&
      dpad.y < actions.y + actions.height &&
      dpad.y + dpad.height > actions.y;
    expect(overlaps, 'D-pad and action clusters overlap').toBe(false);
  }
}

type Box = { x: number; y: number; width: number; height: number };

async function boxOf(locator: Locator): Promise<Box> {
  const box = await locator.boundingBox();
  if (!box) throw new Error('control has no bounding box (not visible)');
  return box;
}

const centre = (b: Box) => ({ x: b.x + b.width / 2, y: b.y + b.height / 2 });

async function expectInQuadrant(page: Page, locator: Locator, side: 'left' | 'right', name: string) {
  const view = page.viewportSize()!;
  const c = centre(await boxOf(locator));
  const horizontal = side === 'left' ? c.x < view.width / 2 : c.x > view.width / 2;
  expect(horizontal, `${name} centre is on the ${side}`).toBe(true);
  expect(c.y, `${name} centre is in the bottom half`).toBeGreaterThan(view.height / 2);
}
