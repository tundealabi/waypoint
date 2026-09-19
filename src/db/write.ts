import { createId } from '../store/ids';
import type { Entity, Mutation } from '../sync';
import { applyMutation, tick } from '../sync';
import type { SqliteDb } from './driver';
import { loadEntity, persistEntity } from './entities';
import { getDeviceId, getHlc, setHlc } from './meta';
import { insertOutbox } from './outbox';

export type FieldWrite = {
  field: string;
  value: unknown;
};

export function writeFields(
  db: SqliteDb,
  input: {
    entityId: string;
    tripId: string;
    entityType: string;
    changes: FieldWrite[];
    enqueue?: boolean;
  }
): { resurrected: boolean } {
  if (input.changes.length === 0) {
    return { resurrected: false };
  }

  return db.withTransaction(() => {
    const enqueue = input.enqueue !== false;
    const deviceId = getDeviceId(db);
    let last = getHlc(db);
    let entity: Entity = loadEntity(db, input.entityId) ?? {
      id: input.entityId,
      tripId: input.tripId,
      type: input.entityType,
      fields: {},
    };
    let resurrected = false;

    for (const change of input.changes) {
      const now = Date.now();
      last = tick(last, now);
      const mutation: Mutation = {
        mutationId: createId(),
        entityId: input.entityId,
        entityType: input.entityType,
        field: change.field,
        value: change.value,
        clock: last,
        deviceId,
        createdAt: now,
      };
      const result = applyMutation(entity, mutation);
      entity = result.entity;
      if (result.resurrected) {
        resurrected = true;
      }
      if (result.applied && enqueue) {
        insertOutbox(db, mutation, false);
      }
    }

    persistEntity(db, entity);
    if (last) {
      setHlc(db, last);
    }
    return { resurrected };
  });
}
