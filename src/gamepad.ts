export type EmulatorButton = 'up' | 'down' | 'left' | 'right' | 'a' | 'b' | 'l' | 'r' | 'select' | 'start';

export type GamepadReadOptions = {
  deadzone?: number;
  threshold?: number;
  invertCrossCircle?: boolean;
};

const DEFAULT_DEADZONE = 0.55;
const DEFAULT_THRESHOLD = 0.6;

const buttonActive = (button: GamepadButton | undefined, threshold: number) =>
  Boolean(button && (button.pressed || button.value > threshold));

export function pickPreferredGamepadFromList(pads: (Gamepad | null)[]) {
  const connected = pads.filter(Boolean) as Gamepad[];
  const dualsense = connected.find((pad) => /dualsense|wireless controller/i.test(pad.id));
  return dualsense ?? connected[0] ?? null;
}

export function readEmulatorButtonsFromGamepad(
  pad: Gamepad,
  { deadzone = DEFAULT_DEADZONE, threshold = DEFAULT_THRESHOLD, invertCrossCircle = false }: GamepadReadOptions = {},
): { buttons: Record<EmulatorButton, boolean>; fastForward: boolean; rewind: boolean } {
  const axesX = pad.axes[0] ?? 0;
  const axesY = pad.axes[1] ?? 0;

  const cross = 0; // bottom
  const circle = 1; // right
  const square = 2; // left
  const triangle = 3; // top

  const aPrimary = invertCrossCircle ? cross : circle;
  const bPrimary = invertCrossCircle ? circle : cross;

  return {
    buttons: {
      up: buttonActive(pad.buttons[12], threshold) || axesY < -deadzone,
      down: buttonActive(pad.buttons[13], threshold) || axesY > deadzone,
      left: buttonActive(pad.buttons[14], threshold) || axesX < -deadzone,
      right: buttonActive(pad.buttons[15], threshold) || axesX > deadzone,
      // Keep top/left as alternates: triangle behaves like A, square like B.
      a: buttonActive(pad.buttons[aPrimary], threshold) || buttonActive(pad.buttons[triangle], threshold),
      b: buttonActive(pad.buttons[bPrimary], threshold) || buttonActive(pad.buttons[square], threshold),
      l: buttonActive(pad.buttons[4], threshold),
      r: buttonActive(pad.buttons[5], threshold),
      select: buttonActive(pad.buttons[8], threshold),
      start: buttonActive(pad.buttons[9], threshold),
    },
    // Triggers: L2/R2
    fastForward: buttonActive(pad.buttons[7], threshold),
    rewind: buttonActive(pad.buttons[6], threshold),
  };
}

