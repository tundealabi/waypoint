import { DatabaseSync } from 'node:sqlite';

import type { SqliteDb, SqlValue } from './driver';

export function openNodeDatabase(path: string): SqliteDb {
  const db = new DatabaseSync(path);
  return {
    exec(sql: string) {
      db.exec(sql);
    },
    run(sql: string, params: SqlValue[] = []) {
      db.prepare(sql).run(...params);
    },
    getAll<T>(sql: string, params: SqlValue[] = []) {
      return db.prepare(sql).all(...params) as T[];
    },
    getFirst<T>(sql: string, params: SqlValue[] = []) {
      const row = db.prepare(sql).get(...params);
      return (row as T | undefined) ?? null;
    },
    withTransaction<T>(fn: () => T) {
      db.exec('BEGIN');
      try {
        const result = fn();
        db.exec('COMMIT');
        return result;
      } catch (error) {
        db.exec('ROLLBACK');
        throw error;
      }
    },
    close() {
      db.close();
    },
  };
}
