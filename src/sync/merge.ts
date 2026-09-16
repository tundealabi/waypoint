import { compareClocked } from './hlc';
import type { ApplyResult, Entity, FieldRecord, Mutation } from './types';

const DELETED_FIELD = 'deleted';

export function applyMutation(entity: Entity, mutation: Mutation): ApplyResult {
  if (mutation.entityId !== entity.id) {
    throw new Error(
      `applyMutation: mutation entity ${mutation.entityId} does not match ${entity.id}`
    );
  }

  const incoming: FieldRecord = {
    value: mutation.value,
    clock: { wall: mutation.clock.wall, logical: mutation.clock.logical },
    deviceId: mutation.deviceId,
  };

  const current = entity.fields[mutation.field];
  const applied = current === undefined || compareClocked(incoming, current) > 0;
  const fields = applied ? { ...entity.fields, [mutation.field]: incoming } : { ...entity.fields };

  const wasDeleted = entity.fields[DELETED_FIELD]?.value === true;
  let resurrected = false;
  const deleted = fields[DELETED_FIELD];

  if (deleted?.value === true) {
    const incomingBeatsDelete =
      applied && mutation.field !== DELETED_FIELD && compareClocked(incoming, deleted) > 0;

    if (incomingBeatsDelete) {
      fields[DELETED_FIELD] = {
        value: false,
        clock: incoming.clock,
        deviceId: incoming.deviceId,
      };
      resurrected = wasDeleted;
    } else {
      const winner = winningEditAgainstDelete(fields);
      if (winner) {
        fields[DELETED_FIELD] = {
          value: false,
          clock: winner.clock,
          deviceId: winner.deviceId,
        };
      }
    }
  }

  return {
    entity: { ...entity, fields },
    applied,
    resurrected,
  };
}

function winningEditAgainstDelete(fields: Record<string, FieldRecord>): FieldRecord | null {
  const deleted = fields[DELETED_FIELD];
  if (!deleted || deleted.value !== true) {
    return null;
  }

  let winner: FieldRecord | null = null;
  for (const [name, record] of Object.entries(fields)) {
    if (name === DELETED_FIELD) {
      continue;
    }
    if (compareClocked(record, deleted) <= 0) {
      continue;
    }
    if (winner === null || compareClocked(record, winner) > 0) {
      winner = record;
    }
  }
  return winner;
}
