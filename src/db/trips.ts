import type { Invite, Member, Role, Trip, TripDraft, User } from '../store/types';
import type { SqliteDb } from './driver';

type UserRow = { id: string; email: string; name: string };
type TripRow = {
  id: string;
  name: string;
  destination: string;
  start_date: string;
  end_date: string;
  emoji: string | null;
  cover_uri: string | null;
  owner_id: string;
  deleted: number;
};
type MemberRow = {
  id: string;
  trip_id: string;
  user_id: string;
  role: string;
  email: string;
  name: string;
};
type InviteRow = {
  id: string;
  trip_id: string;
  token: string;
  expires_at: number;
  used: number;
};
type ArchiveRow = { trip_id: string; user_id: string };

export function loadUsers(db: SqliteDb): User[] {
  return db.getAll<UserRow>('SELECT id, email, name FROM users');
}

export function upsertUser(db: SqliteDb, user: User): void {
  db.run('INSERT OR REPLACE INTO users (id, email, name) VALUES (?, ?, ?)', [
    user.id,
    user.email,
    user.name,
  ]);
}

export function updateUserProfile(db: SqliteDb, userId: string, email: string, name: string): void {
  db.run('UPDATE users SET email = ?, name = ? WHERE id = ?', [email, name, userId]);
  db.run('UPDATE members SET email = ?, name = ? WHERE user_id = ?', [email, name, userId]);
}

export function loadTrips(db: SqliteDb): Trip[] {
  const trips = db.getAll<TripRow>('SELECT * FROM trips');
  const archived = db.getAll<ArchiveRow>('SELECT trip_id, user_id FROM local_archive');
  const archivedByTrip = new Map<string, Record<string, boolean>>();
  for (const row of archived) {
    const current = archivedByTrip.get(row.trip_id) ?? {};
    current[row.user_id] = true;
    archivedByTrip.set(row.trip_id, current);
  }
  return trips.map((row) => ({
    id: row.id,
    name: row.name,
    destination: row.destination,
    startDate: row.start_date,
    endDate: row.end_date,
    emoji: row.emoji ?? undefined,
    coverUri: row.cover_uri ?? undefined,
    ownerId: row.owner_id,
    archivedBy: archivedByTrip.get(row.id) ?? {},
    deleted: Number(row.deleted) === 1,
  }));
}

export function insertTrip(db: SqliteDb, trip: Trip): void {
  db.run(
    `INSERT INTO trips (
      id, name, destination, start_date, end_date, emoji, cover_uri, owner_id, deleted
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      trip.id,
      trip.name,
      trip.destination,
      trip.startDate,
      trip.endDate,
      trip.emoji ?? null,
      trip.coverUri ?? null,
      trip.ownerId,
      trip.deleted ? 1 : 0,
    ]
  );
}

export function updateTripRow(db: SqliteDb, tripId: string, draft: Partial<TripDraft>): void {
  const current = db.getFirst<TripRow>('SELECT * FROM trips WHERE id = ?', [tripId]);
  if (!current) {
    return;
  }
  db.run(
    `UPDATE trips SET
      name = ?, destination = ?, start_date = ?, end_date = ?, emoji = ?, cover_uri = ?
     WHERE id = ?`,
    [
      draft.name?.trim() ?? current.name,
      draft.destination?.trim() ?? current.destination,
      draft.startDate ?? current.start_date,
      draft.endDate ?? current.end_date,
      draft.emoji !== undefined ? draft.emoji.trim() || null : current.emoji,
      draft.coverUri !== undefined ? draft.coverUri : current.cover_uri,
      tripId,
    ]
  );
}

export function markTripDeleted(db: SqliteDb, tripId: string): void {
  db.run('UPDATE trips SET deleted = 1 WHERE id = ?', [tripId]);
}

export function setLocalArchive(
  db: SqliteDb,
  tripId: string,
  userId: string,
  archived: boolean
): void {
  if (archived) {
    db.run('INSERT OR REPLACE INTO local_archive (trip_id, user_id) VALUES (?, ?)', [
      tripId,
      userId,
    ]);
    return;
  }
  db.run('DELETE FROM local_archive WHERE trip_id = ? AND user_id = ?', [tripId, userId]);
}

export function loadMembers(db: SqliteDb): Member[] {
  return db.getAll<MemberRow>('SELECT * FROM members').map((row) => ({
    id: row.id,
    tripId: row.trip_id,
    userId: row.user_id,
    role: row.role as Role,
    email: row.email,
    name: row.name,
  }));
}

export function insertMember(db: SqliteDb, member: Member): void {
  db.run(
    'INSERT INTO members (id, trip_id, user_id, role, email, name) VALUES (?, ?, ?, ?, ?, ?)',
    [member.id, member.tripId, member.userId, member.role, member.email, member.name]
  );
}

export function deleteMemberRow(db: SqliteDb, memberId: string): void {
  db.run('DELETE FROM members WHERE id = ?', [memberId]);
}

export function loadInvites(db: SqliteDb): Invite[] {
  return db.getAll<InviteRow>('SELECT * FROM invites').map((row) => ({
    id: row.id,
    tripId: row.trip_id,
    token: row.token,
    expiresAt: Number(row.expires_at),
    used: Number(row.used) === 1,
  }));
}

export function insertInvite(db: SqliteDb, invite: Invite): void {
  db.run('INSERT INTO invites (id, trip_id, token, expires_at, used) VALUES (?, ?, ?, ?, ?)', [
    invite.id,
    invite.tripId,
    invite.token,
    invite.expiresAt,
    invite.used ? 1 : 0,
  ]);
}

export function markInviteUsed(db: SqliteDb, inviteId: string): void {
  db.run('UPDATE invites SET used = 1 WHERE id = ?', [inviteId]);
}
