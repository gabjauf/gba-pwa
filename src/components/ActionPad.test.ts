import { describe, expect, it } from 'vitest';
import { buttonsFromPoint } from './ActionPad';

// A on the right, B on the left; each 80x80 → centers (140,40) and (40,40), radius 40.
const rectA = { left: 100, top: 0, width: 80, height: 80 } as DOMRect;
const rectB = { left: 0, top: 0, width: 80, height: 80 } as DOMRect;

describe('buttonsFromPoint', () => {
  it('presses A over the A button', () => {
    expect(buttonsFromPoint(140, 40, rectA, rectB)).toEqual(['a']);
  });

  it('presses B over the B button', () => {
    expect(buttonsFromPoint(40, 40, rectA, rectB)).toEqual(['b']);
  });

  it('presses both when centred between them', () => {
    expect(buttonsFromPoint(90, 40, rectA, rectB)).toEqual(['a', 'b']);
  });

  it('presses nothing when far away', () => {
    expect(buttonsFromPoint(400, 400, rectA, rectB)).toEqual([]);
  });
});
