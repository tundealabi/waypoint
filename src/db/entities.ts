import type { PackingItem } from '../store/types';
import type { Entity, FieldRecord } from '../sync';
import { PACKING_ENTITY_TYPE } from '../sync';
import type { SqliteDb } from './driver';

type EntitySqlRow = {
  id: string;
  trip_id: string;
  entity_type: string;
};

type FieldSqlRow = {
  entity_id: string;
  field: string;
  value_json: string;
  wall: number;
  logical: number;
  device_id: string;
};

export function loadEntity(db: SqliteDb, entityId: string): Entity | null {
  const row = db.getFirst<EntitySqlRow>(
    'SELECT id, trip_id, entity_type FROM entities WHERE id = ?',
    [entityId]
  );
  if (!row) {
    return null;
  }
  return {
    id: row.id,
    tripId: row.trip_id,
    type: row.entity_type,
    fields: loadFields(db, entityId),
  };
}

export function persistEntity(db: SqliteDb, entity: Entity): void {
  db.run('INSERT OR REPLACE INTO entities (id, trip_id, entity_type) VALUES (?, ?, ?)', [
    entity.id,
    entity.tripId,
    entity.type,
  ]);
  for (const [field, record] of Object.entries(entity.fields)) {
    persistField(db, entity.id, field, record);
  }
}

export function persistField(
  db: SqliteDb,
  entityId: string,
  field: string,
  record: FieldRecord
): void {
  db.run(
    `INSERT OR REPLACE INTO entity_fields (
      entity_id, field, value_json, wall, logical, device_id
    ) VALUES (?, ?, ?, ?, ?, ?)`,
    [
      entityId,
      field,
      JSON.stringify(record.value),
      record.clock.wall,
      record.clock.logical,
      record.deviceId,
    ]
  );
}

export function loadPackingItems(db: SqliteDb): PackingItem[] {
  return loadEntitiesByType(db, PACKING_ENTITY_TYPE).map(toPackingItem);
}

export function loadEntitiesByType(db: SqliteDb, entityType: string): Entity[] {
  const rows = db.getAll<EntitySqlRow>(
    'SELECT id, trip_id, entity_type FROM entities WHERE entity_type = ?',
    [entityType]
  );
  const fields = db.getAll<FieldSqlRow>(
    `SELECT f.entity_id, f.field, f.value_json, f.wall, f.logical, f.device_id
     FROM entity_fields f
     INNER JOIN entities e ON e.id = f.entity_id
     WHERE e.entity_type = ?`,
    [entityType]
  );
  const byEntity = new Map<string, Record<string, FieldRecord>>();
  for (const row of fields) {
    const current = byEntity.get(row.entity_id) ?? {};
    current[row.field] = {
      value: JSON.parse(row.value_json) as unknown,
      clock: { wall: Number(row.wall), logical: Number(row.logical) },
      deviceId: row.device_id,
    };
    byEntity.set(row.entity_id, current);
  }
  return rows.map((row) => ({
    id: row.id,
    tripId: row.trip_id,
    type: row.entity_type,
    fields: byEntity.get(row.id) ?? {},
  }));
}

export function toPackingItem(entity: Entity): PackingItem {
  const assignee = optionalString(entity.fields.assignee?.value);
  const quantity = optionalString(entity.fields.quantity?.value);
  const note = optionalString(entity.fields.note?.value);
  return {
    id: entity.id,
    tripId: entity.tripId,
    name: typeof entity.fields.name?.value === 'string' ? entity.fields.name.value : '',
    quantity,
    note,
    assigneeId: assignee,
    packed: entity.fields.packed?.value === true,
    position: typeof entity.fields.position?.value === 'number' ? entity.fields.position.value : 0,
    deleted: entity.fields.deleted?.value === true,
  };
}

function loadFields(db: SqliteDb, entityId: string): Record<string, FieldRecord> {
  const rows = db.getAll<FieldSqlRow>(
    'SELECT entity_id, field, value_json, wall, logical, device_id FROM entity_fields WHERE entity_id = ?',
    [entityId]
  );
  const fields: Record<string, FieldRecord> = {};
  for (const row of rows) {
    fields[row.field] = {
      value: JSON.parse(row.value_json) as unknown,
      clock: { wall: Number(row.wall), logical: Number(row.logical) },
      deviceId: row.device_id,
    };
  }
  return fields;
}

function optionalString(value: unknown): string | undefined {
  if (typeof value !== 'string' || value.length === 0) {
    return undefined;
  }
  return value;
}
