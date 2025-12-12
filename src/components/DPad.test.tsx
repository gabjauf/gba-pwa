/** @vitest-environment jsdom */
import { cleanup, fireEvent, render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import DPad from './DPad';

function mockRect(element: HTMLElement) {
  vi.spyOn(element, 'getBoundingClientRect').mockReturnValue({
    left: 0,
    top: 0,
    right: 300,
    bottom: 300,
    width: 300,
    height: 300,
    x: 0,
    y: 0,
    toJSON: () => ({}),
  });
}

describe('DPad', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('presses single directions based on pointer position', () => {
    const onPress = vi.fn();
    const onUnpress = vi.fn();
    const { getByLabelText } = render(<DPad onPress={onPress} onUnpress={onUnpress} />);
    const dpad = getByLabelText('D-pad') as HTMLElement;
    mockRect(dpad);

    fireEvent.pointerDown(dpad, { clientX: 250, clientY: 150, pointerId: 1 });
    expect(onPress).toHaveBeenCalledTimes(1);
    expect(onPress).toHaveBeenCalledWith('right');

    fireEvent.pointerUp(dpad, { pointerId: 1 });
    expect(onUnpress).toHaveBeenCalledWith('right');
  });

  it('supports diagonals and updates on move', () => {
    const onPress = vi.fn();
    const onUnpress = vi.fn();
    const { getByLabelText } = render(<DPad onPress={onPress} onUnpress={onUnpress} />);
    const dpad = getByLabelText('D-pad') as HTMLElement;
    mockRect(dpad);

    fireEvent.pointerDown(dpad, { clientX: 230, clientY: 230, pointerId: 1 });
    const firstPresses = onPress.mock.calls.map((c) => c[0]).sort();
    expect(firstPresses).toEqual(['down', 'right']);

    onPress.mockClear();

    fireEvent.pointerMove(dpad, { clientX: 70, clientY: 230, pointerId: 1 });
    expect(onUnpress).toHaveBeenCalledWith('right');
    expect(onPress).toHaveBeenCalledWith('left');
    expect(onPress).toHaveBeenCalledTimes(1);

    fireEvent.pointerUp(dpad, { pointerId: 1 });
    const unpresses = onUnpress.mock.calls.map((c) => c[0]);
    expect(unpresses).toEqual(expect.arrayContaining(['down', 'left', 'right']));
  });
});
