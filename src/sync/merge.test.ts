import { describe, expect, it } from 'vitest';

import { applyMutation } from './merge';
import { PACKING_ENTITY_TYPE, PACKING_FIELDS, packingSchema } from './packing-schema';
import type { Entity, LogicalClock, Mutation } from './types';

const TRIP_ID = 'trip-1';
const ENTITY_ID = 'item-1';
const DEVICE_A = 'device-a';
const DEVICE_B = 'device-b';

function packingItem(): Entity {
  return {
    id: ENTITY_ID,
    tripId: TRIP_ID,
    type: packingSchema.entityType,
    fields: {},
  };
}

function clock(wall: number, logical = 0): LogicalClock {
  return { wall, logical };
}

function mutation(
  field: (typeof PACKING_FIELDS)[number],
  value: unknown,
  at: LogicalClock,
  deviceId: string
): Mutation {
  return {
    mutationId: `${field}-${at.wall}-${at.logical}-${deviceId}`,
    entityId: ENTITY_ID,
    entityType: PACKING_ENTITY_TYPE,
    field,
    value,
    clock: at,
    deviceId,
    createdAt: at.wall,
  };
}

function applyAll(entity: Entity, mutations: Mutation[]): Entity {
  return mutations.reduce((current, next) => applyMutation(current, next).entity, entity);
}

describe('packing schema', () => {
  it('versions packing fields independently under one entity type', () => {
    expect(packingSchema.entityType).toBe('packing_item');
    expect(packingSchema.fields).toEqual([
      'name',
      'quantity',
      'note',
      'assignee',
      'packed',
      'position',
      'deleted',
    ]);
  });
});

describe('applyMutation HLC-LWW', () => {
  it('lets concurrent different fields both survive', () => {
    const entity = applyAll(packingItem(), [
      mutation('name', 'Passport', clock(10), DEVICE_A),
      mutation('quantity', '1', clock(11), DEVICE_B),
      mutation('note', 'keep in bag', clock(9), DEVICE_A),
    ]);

    expect(entity.fields.name?.value).toBe('Passport');
    expect(entity.fields.quantity?.value).toBe('1');
    expect(entity.fields.note?.value).toBe('keep in bag');
    expect(entity.fields.deleted).toBeUndefined();
  });

  it('drops a lower-wall write when the other device clock is ahead (clock skew)', () => {
    const first = applyMutation(packingItem(), mutation('name', 'From A', clock(1_000), DEVICE_A));
    const second = applyMutation(
      first.entity,
      mutation('name', 'From B, skewed behind', clock(100), DEVICE_B)
    );

    expect(first.applied).toBe(true);
    expect(second.applied).toBe(false);
    expect(second.entity.fields.name?.value).toBe('From A');
  });

  it('applies the next local write after observing the remote clock, even if wall time is still behind', () => {
    const remote = applyMutation(packingItem(), mutation('name', 'From A', clock(1_000), DEVICE_A));
    const local = applyMutation(
      remote.entity,
      mutation('name', 'From B after observe', clock(1_000, 1), DEVICE_B)
    );

    expect(local.applied).toBe(true);
    expect(local.entity.fields.name?.value).toBe('From B after observe');
  });

  it('breaks equal clocks with the higher device id', () => {
    const tied = clock(50, 2);
    const aFirst = applyMutation(packingItem(), mutation('packed', true, tied, DEVICE_A));
    const bWins = applyMutation(aFirst.entity, mutation('packed', false, tied, DEVICE_B));

    expect(bWins.applied).toBe(true);
    expect(bWins.entity.fields.packed?.value).toBe(false);

    const bFirst = applyMutation(packingItem(), mutation('packed', false, tied, DEVICE_B));
    const aLoses = applyMutation(bFirst.entity, mutation('packed', true, tied, DEVICE_A));

    expect(aLoses.applied).toBe(false);
    expect(aLoses.entity.fields.packed?.value).toBe(false);
  });

  it('does not drop the row when deleted', () => {
    const entity = applyAll(packingItem(), [
      mutation('name', 'Adapter', clock(1), DEVICE_A),
      mutation('deleted', true, clock(2), DEVICE_A),
    ]);

    expect(entity.fields.deleted?.value).toBe(true);
    expect(entity.fields.name?.value).toBe('Adapter');
    expect(entity.id).toBe(ENTITY_ID);
  });

  it('resurrects when a later edit beats a delete', () => {
    const deleted = applyMutation(packingItem(), mutation('deleted', true, clock(10), DEVICE_A));
    const edited = applyMutation(
      deleted.entity,
      mutation('name', 'Restored jacket', clock(11), DEVICE_B)
    );

    expect(deleted.entity.fields.deleted?.value).toBe(true);
    expect(edited.applied).toBe(true);
    expect(edited.resurrected).toBe(true);
    expect(edited.entity.fields.deleted?.value).toBe(false);
    expect(edited.entity.fields.name?.value).toBe('Restored jacket');
  });

  it('stays tombstoned when a later delete beats an earlier edit', () => {
    const named = applyMutation(packingItem(), mutation('name', 'Sunscreen', clock(10), DEVICE_A));
    const deleted = applyMutation(named.entity, mutation('deleted', true, clock(11), DEVICE_B));

    expect(deleted.applied).toBe(true);
    expect(deleted.resurrected).toBe(false);
    expect(deleted.entity.fields.deleted?.value).toBe(true);
    expect(deleted.entity.fields.name?.value).toBe('Sunscreen');
  });

  it('keeps the tombstone when an earlier edit arrives after a later delete', () => {
    const deleted = applyMutation(packingItem(), mutation('deleted', true, clock(20), DEVICE_A));
    const staleEdit = applyMutation(deleted.entity, mutation('quantity', '2', clock(19), DEVICE_B));

    expect(staleEdit.applied).toBe(true);
    expect(staleEdit.resurrected).toBe(false);
    expect(staleEdit.entity.fields.deleted?.value).toBe(true);
    expect(staleEdit.entity.fields.quantity?.value).toBe('2');
  });

  it('does not resurrect when applying a stale delete onto an already newer edit', () => {
    const named = applyMutation(packingItem(), mutation('name', 'Shoes', clock(30), DEVICE_A));
    const staleDelete = applyMutation(named.entity, mutation('deleted', true, clock(10), DEVICE_B));

    expect(staleDelete.resurrected).toBe(false);
    expect(staleDelete.entity.fields.deleted?.value).toBe(false);
    expect(staleDelete.entity.fields.name?.value).toBe('Shoes');
  });
});
