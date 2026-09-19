import { createId } from '../store/ids';
import type { LogicalClock } from '../sync';
import type { SqliteDb } from './driver';

const DEVICE_ID_KEY = 'device_id';
const HLC_KEY = 'hlc';

export function getMeta(db: SqliteDb, key: string): string | null {
  const row = db.getFirst<{ value: string }>('SELECT value FROM meta WHERE key = ?', [key]);
  return row?.value ?? null;
}

export function setMeta(db: SqliteDb, key: string, value: string): void {
  db.run('INSERT OR REPLACE INTO meta (key, value) VALUES (?, ?)', [key, value]);
}

export function getDeviceId(db: SqliteDb): string {
  const existing = getMeta(db, DEVICE_ID_KEY);
  if (existing) {
    return existing;
  }
  const id = createId();
  setMeta(db, DEVICE_ID_KEY, id);
  return id;
}

export function getHlc(db: SqliteDb): LogicalClock | null {
  const raw = getMeta(db, HLC_KEY);
  if (!raw) {
    return null;
  }
  return JSON.parse(raw) as LogicalClock;
}

export function setHlc(db: SqliteDb, clock: LogicalClock): void {
  setMeta(db, HLC_KEY, JSON.stringify(clock));
}
