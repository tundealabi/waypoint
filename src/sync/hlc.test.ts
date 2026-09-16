import { describe, expect, it } from 'vitest';

import { compareClocked, compareClocks, observe, tick } from './hlc';

describe('tick', () => {
  it('uses physical time when there is no last clock', () => {
    expect(tick(null, 1_000)).toEqual({ wall: 1_000, logical: 0 });
  });

  it('resets logical when wall moves forward', () => {
    expect(tick({ wall: 1_000, logical: 4 }, 1_001)).toEqual({ wall: 1_001, logical: 0 });
  });

  it('increments logical when wall does not move', () => {
    expect(tick({ wall: 1_000, logical: 4 }, 1_000)).toEqual({ wall: 1_000, logical: 5 });
  });

  it('keeps the last wall when physical time is behind (clock skew)', () => {
    expect(tick({ wall: 1_000, logical: 0 }, 100)).toEqual({ wall: 1_000, logical: 1 });
  });
});

describe('observe then tick', () => {
  it('makes the next local tick strictly greater than a remote clock, including clock skew', () => {
    const remote = { wall: 5_000, logical: 2 };
    const last = observe({ wall: 100, logical: 9 }, remote);
    const next = tick(last, 100);

    expect(compareClocks(next, remote)).toBeGreaterThan(0);
    expect(next).toEqual({ wall: 5_000, logical: 3 });
  });

  it('does not rewind when the remote clock is older', () => {
    const last = { wall: 5_000, logical: 2 };
    expect(observe(last, { wall: 100, logical: 99 })).toEqual(last);
  });
});

describe('compareClocked', () => {
  it('orders by wall, then logical, then device id', () => {
    expect(
      compareClocked(
        { clock: { wall: 1, logical: 0 }, deviceId: 'b' },
        { clock: { wall: 2, logical: 0 }, deviceId: 'a' }
      )
    ).toBeLessThan(0);

    expect(
      compareClocked(
        { clock: { wall: 2, logical: 1 }, deviceId: 'a' },
        { clock: { wall: 2, logical: 0 }, deviceId: 'z' }
      )
    ).toBeGreaterThan(0);

    expect(
      compareClocked(
        { clock: { wall: 2, logical: 1 }, deviceId: 'device-b' },
        { clock: { wall: 2, logical: 1 }, deviceId: 'device-a' }
      )
    ).toBeGreaterThan(0);
  });
});
