import { describe, expect, it } from 'vitest';

import { positionBetween } from './position';

describe('positionBetween', () => {
  it('starts an empty list at 0', () => {
    expect(positionBetween(null, null)).toBe(0);
  });

  it('appends after the last neighbor without rewriting it', () => {
    expect(positionBetween(0, null)).toBe(1);
    expect(positionBetween(1, null)).toBe(2);
  });

  it('prepends before the first neighbor without rewriting it', () => {
    expect(positionBetween(null, 0)).toBe(-1);
  });

  it('places a moved row strictly between two neighbors', () => {
    const moved = positionBetween(0, 2);
    expect(moved).toBeGreaterThan(0);
    expect(moved).toBeLessThan(2);
    expect(moved).toBe(1);
  });

  it('can keep inserting between the same pair without touching other positions', () => {
    const first = positionBetween(0, 1);
    const second = positionBetween(0, first);

    expect(first).toBe(0.5);
    expect(second).toBe(0.25);
    expect(second).toBeGreaterThan(0);
    expect(second).toBeLessThan(first);
  });

  it('rejects a gap that is not strictly increasing', () => {
    expect(() => positionBetween(1, 1)).toThrow(/before < after/);
    expect(() => positionBetween(2, 1)).toThrow(/before < after/);
  });
});
