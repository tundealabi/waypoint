import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import { listUnsynced, markOutboxSynced, migrate } from './index';
import { openNodeDatabase } from './node-sqlite';
import { writeFields } from './write';

function tempDbPath(): string {
  return join(mkdtempSync(join(tmpdir(), 'waypoint-')), 'waypoint.db');
}

describe('outbox survives process death', () => {
  it('keeps three unsynced rows across close/reopen until a successful push', () => {
    const path = tempDbPath();
    const first = openNodeDatabase(path);
    migrate(first);

    writeFields(first, {
      entityId: 'item-1',
      tripId: 'trip-1',
      entityType: 'packing_item',
      changes: [
        { field: 'name', value: 'Passport' },
        { field: 'packed', value: false },
        { field: 'deleted', value: false },
      ],
    });

    expect(listUnsynced(first)).toHaveLength(3);
    first.close();

    const relaunched = openNodeDatabase(path);
    const pending = listUnsynced(relaunched);
    expect(pending).toHaveLength(3);
    expect(pending.every((row) => row.synced === false)).toBe(true);
    expect(pending.map((row) => row.field).sort()).toEqual(['deleted', 'name', 'packed']);

    markOutboxSynced(
      relaunched,
      pending.map((row) => row.mutationId)
    );
    expect(listUnsynced(relaunched)).toHaveLength(0);
    relaunched.close();

    const afterPush = openNodeDatabase(path);
    expect(listUnsynced(afterPush)).toHaveLength(0);
    afterPush.close();
  });
});
