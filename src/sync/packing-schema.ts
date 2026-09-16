import type { EntitySchema } from './types';

export const PACKING_ENTITY_TYPE = 'packing_item';

export const PACKING_FIELDS = [
  'name',
  'quantity',
  'note',
  'assignee',
  'packed',
  'position',
  'deleted',
] as const;

export type PackingField = (typeof PACKING_FIELDS)[number];

export const packingSchema: EntitySchema = {
  entityType: PACKING_ENTITY_TYPE,
  fields: PACKING_FIELDS,
};

export function isPackingField(field: string): field is PackingField {
  return (PACKING_FIELDS as readonly string[]).includes(field);
}
