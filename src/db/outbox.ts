import type { Mutation } from '../sync';
import type { SqliteDb } from './driver';

export type OutboxRow = Mutation & {
  synced: boolean;
};

type OutboxSqlRow = {
  mutation_id: string;
  entity_id: string;
  entity_type: string;
  field: string;
  value_json: string;
  wall: number;
  logical: number;
  device_id: string;
  created_at: number;
  synced: number;
};

export function insertOutbox(db: SqliteDb, mutation: Mutation, synced: boolean): void {
  db.run(
    `INSERT INTO outbox (
      mutation_id, entity_id, entity_type, field, value_json,
      wall, logical, device_id, created_at, synced
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      mutation.mutationId,
      mutation.entityId,
      mutation.entityType,
      mutation.field,
      JSON.stringify(mutation.value),
      mutation.clock.wall,
      mutation.clock.logical,
      mutation.deviceId,
      mutation.createdAt,
      synced ? 1 : 0,
    ]
  );
}

export function listUnsynced(db: SqliteDb): OutboxRow[] {
  const rows = db.getAll<OutboxSqlRow>(
    'SELECT * FROM outbox WHERE synced = 0 ORDER BY created_at ASC, mutation_id ASC'
  );
  return rows.map(fromSql);
}

export function countUnsynced(db: SqliteDb): number {
  const row = db.getFirst<{ n: number }>('SELECT COUNT(*) AS n FROM outbox WHERE synced = 0');
  return Number(row?.n ?? 0);
}

export function markOutboxSynced(db: SqliteDb, mutationIds: string[]): void {
  for (const mutationId of mutationIds) {
    db.run('UPDATE outbox SET synced = 1 WHERE mutation_id = ?', [mutationId]);
  }
}

function fromSql(row: OutboxSqlRow): OutboxRow {
  return {
    mutationId: row.mutation_id,
    entityId: row.entity_id,
    entityType: row.entity_type,
    field: row.field,
    value: JSON.parse(row.value_json) as unknown,
    clock: { wall: Number(row.wall), logical: Number(row.logical) },
    deviceId: row.device_id,
    createdAt: Number(row.created_at),
    synced: Number(row.synced) === 1,
  };
}
