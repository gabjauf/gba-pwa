/** @vitest-environment jsdom */
import { cleanup, fireEvent, render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import ActionPad from './ActionPad';

function mockRect(element: HTMLElement, rect: Partial<DOMRect>) {
  vi.spyOn(element, 'getBoundingClientRect').mockReturnValue({
    left: rect.left ?? 0,
    top: rect.top ?? 0,
    right: (rect.left ?? 0) + (rect.width ?? 0),
    bottom: (rect.top ?? 0) + (rect.height ?? 0),
    width: rect.width ?? 0,
    height: rect.height ?? 0,
    x: rect.left ?? 0,
    y: rect.top ?? 0,
    toJSON: () => ({}),
  });
}

describe('ActionPad', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('presses B then rolls to A without lifting', () => {
    const onPress = vi.fn();
    const onUnpress = vi.fn();
    const { getByLabelText, container } = render(
      <ActionPad onPress={onPress} onUnpress={onUnpress} />,
    );
    const pad = getByLabelText('Action buttons') as HTMLElement;
    const buttons = container.querySelectorAll('button');
    const bButton = buttons[0] as HTMLElement;
    const aButton = buttons[1] as HTMLElement;

    mockRect(bButton, { left: 100, top: 160, width: 80, height: 80 });
    mockRect(aButton, { left: 190, top: 120, width: 80, height: 80 });

    fireEvent.pointerDown(pad, { clientX: 140, clientY: 200, pointerId: 1 });
    expect(onPress).toHaveBeenCalledWith('b');

    onPress.mockClear();
    fireEvent.pointerMove(pad, { clientX: 230, clientY: 160, pointerId: 1 });
    expect(onUnpress).toHaveBeenCalledWith('b');
    expect(onPress).toHaveBeenCalledWith('a');

    fireEvent.pointerUp(pad, { pointerId: 1 });
    expect(onUnpress).toHaveBeenCalledWith('a');
  });

  it('presses both when in between A and B', () => {
    const onPress = vi.fn();
    const onUnpress = vi.fn();
    const { getByLabelText, container } = render(
      <ActionPad onPress={onPress} onUnpress={onUnpress} />,
    );
    const pad = getByLabelText('Action buttons') as HTMLElement;
    const buttons = container.querySelectorAll('button');
    const bButton = buttons[0] as HTMLElement;
    const aButton = buttons[1] as HTMLElement;

    mockRect(bButton, { left: 100, top: 160, width: 80, height: 80 });
    mockRect(aButton, { left: 190, top: 120, width: 80, height: 80 });

    fireEvent.pointerDown(pad, { clientX: 185, clientY: 180, pointerId: 1 });
    const pressed = onPress.mock.calls.map((c) => c[0]).sort();
    expect(pressed).toEqual(['a', 'b']);

    fireEvent.pointerUp(pad, { pointerId: 1 });
    const unpressed = onUnpress.mock.calls.map((c) => c[0]).sort();
    expect(unpressed).toEqual(['a', 'b']);
  });
});

