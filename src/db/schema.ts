import type { SqliteDb } from './driver';

const SCHEMA_SQL = `
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS meta (
  key TEXT PRIMARY KEY NOT NULL,
  value TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS entities (
  id TEXT PRIMARY KEY NOT NULL,
  trip_id TEXT NOT NULL,
  entity_type TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS entity_fields (
  entity_id TEXT NOT NULL,
  field TEXT NOT NULL,
  value_json TEXT NOT NULL,
  wall INTEGER NOT NULL,
  logical INTEGER NOT NULL,
  device_id TEXT NOT NULL,
  PRIMARY KEY (entity_id, field),
  FOREIGN KEY (entity_id) REFERENCES entities(id)
);

CREATE TABLE IF NOT EXISTS outbox (
  mutation_id TEXT PRIMARY KEY NOT NULL,
  entity_id TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  field TEXT NOT NULL,
  value_json TEXT NOT NULL,
  wall INTEGER NOT NULL,
  logical INTEGER NOT NULL,
  device_id TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  synced INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY NOT NULL,
  email TEXT NOT NULL,
  name TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS trips (
  id TEXT PRIMARY KEY NOT NULL,
  name TEXT NOT NULL,
  destination TEXT NOT NULL,
  start_date TEXT NOT NULL,
  end_date TEXT NOT NULL,
  emoji TEXT,
  cover_uri TEXT,
  owner_id TEXT NOT NULL,
  deleted INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS members (
  id TEXT PRIMARY KEY NOT NULL,
  trip_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  role TEXT NOT NULL,
  email TEXT NOT NULL,
  name TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS invites (
  id TEXT PRIMARY KEY NOT NULL,
  trip_id TEXT NOT NULL,
  token TEXT NOT NULL,
  expires_at INTEGER NOT NULL,
  used INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS local_archive (
  trip_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  PRIMARY KEY (trip_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_entities_trip_type ON entities (trip_id, entity_type);
CREATE INDEX IF NOT EXISTS idx_outbox_unsynced ON outbox (synced, created_at);
CREATE INDEX IF NOT EXISTS idx_members_trip ON members (trip_id);
CREATE INDEX IF NOT EXISTS idx_invites_trip ON invites (trip_id);
`;

export function migrate(db: SqliteDb): void {
  db.exec(SCHEMA_SQL);
}
