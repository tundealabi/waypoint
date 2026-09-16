import type { Clocked, LogicalClock } from './types';

export function compareClocks(a: LogicalClock, b: LogicalClock): number {
  if (a.wall !== b.wall) {
    return a.wall < b.wall ? -1 : 1;
  }
  if (a.logical !== b.logical) {
    return a.logical < b.logical ? -1 : 1;
  }
  return 0;
}

export function compareClocked(a: Clocked, b: Clocked): number {
  const clockCmp = compareClocks(a.clock, b.clock);
  if (clockCmp !== 0) {
    return clockCmp;
  }
  if (a.deviceId === b.deviceId) {
    return 0;
  }
  return a.deviceId < b.deviceId ? -1 : 1;
}

export function tick(last: LogicalClock | null, now: number = Date.now()): LogicalClock {
  const wall = last === null ? now : Math.max(last.wall, now);
  if (last !== null && wall === last.wall) {
    return { wall, logical: last.logical + 1 };
  }
  return { wall, logical: 0 };
}

export function observe(last: LogicalClock | null, remote: LogicalClock): LogicalClock {
  if (last === null || compareClocks(remote, last) > 0) {
    return { wall: remote.wall, logical: remote.logical };
  }
  return last;
}
