import { openDatabaseSync } from 'expo-sqlite';

import type { SqliteDb, SqlValue } from './driver';

export function openExpoDatabase(name = 'waypoint.db'): SqliteDb {
  const db = openDatabaseSync(name);
  return {
    exec(sql: string) {
      db.execSync(sql);
    },
    run(sql: string, params: SqlValue[] = []) {
      db.runSync(sql, params);
    },
    getAll<T>(sql: string, params: SqlValue[] = []) {
      return db.getAllSync<T>(sql, params);
    },
    getFirst<T>(sql: string, params: SqlValue[] = []) {
      return db.getFirstSync<T>(sql, params);
    },
    withTransaction<T>(fn: () => T) {
      let result: T | undefined;
      db.withTransactionSync(() => {
        result = fn();
      });
      return result as T;
    },
    close() {
      db.closeSync();
    },
  };
}
