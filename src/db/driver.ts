export type SqlValue = string | number | null;

export type SqliteDb = {
  exec(_sql: string): void;
  run(_sql: string, _params?: SqlValue[]): void;
  getAll<T>(_sql: string, _params?: SqlValue[]): T[];
  getFirst<T>(_sql: string, _params?: SqlValue[]): T | null;
  withTransaction<T>(_fn: () => T): T;
  close(): void;
};
