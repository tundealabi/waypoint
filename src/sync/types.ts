export type LogicalClock = {
  wall: number;
  logical: number;
};

export type Clocked = {
  clock: LogicalClock;
  deviceId: string;
};

export type FieldRecord = Clocked & {
  value: unknown;
};

export type Entity = {
  id: string;
  tripId: string;
  type: string;
  fields: Record<string, FieldRecord>;
};

export type Mutation = {
  mutationId: string;
  entityId: string;
  entityType: string;
  field: string;
  value: unknown;
  clock: LogicalClock;
  deviceId: string;
  createdAt: number;
};

export type ApplyResult = {
  entity: Entity;
  applied: boolean;
  resurrected: boolean;
};

export type EntitySchema = {
  readonly entityType: string;
  readonly fields: readonly string[];
};
