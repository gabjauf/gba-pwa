import { describe, expect, it } from 'vitest';
import { dirsFromPoint } from './DPad';

// 200x200 pad at the origin; center is (100, 100).
const rect = { left: 0, top: 0, width: 200, height: 200 } as DOMRect;

describe('dirsFromPoint', () => {
  it('returns nothing inside the dead-zone', () => {
    expect(dirsFromPoint(100, 100, rect)).toEqual([]);
  });

  it('maps the four cardinals', () => {
    expect(dirsFromPoint(180, 100, rect)).toEqual(['right']);
    expect(dirsFromPoint(100, 180, rect)).toEqual(['down']);
    expect(dirsFromPoint(20, 100, rect)).toEqual(['left']);
    expect(dirsFromPoint(100, 20, rect)).toEqual(['up']);
  });

  it('maps the four diagonals', () => {
    expect(dirsFromPoint(160, 160, rect)).toEqual(['down', 'right']);
    expect(dirsFromPoint(40, 160, rect)).toEqual(['down', 'left']);
    expect(dirsFromPoint(160, 40, rect)).toEqual(['up', 'right']);
    expect(dirsFromPoint(40, 40, rect)).toEqual(['up', 'left']);
  });

  it('registers small deflections that the old 18% dead-zone swallowed', () => {
    // distance 30 from center: dead under 0.18 (=36px), live under 0.12 (=24px).
    expect(dirsFromPoint(130, 100, rect)).toEqual(['right']);
  });
});
