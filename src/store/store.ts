import type { FieldWrite, SqliteDb } from '@/db';
import {
  deleteMemberRow,
  DEMO_INVITE_TOKEN,
  insertInvite,
  insertMember,
  insertTrip,
  LISBON_ID,
  loadPersisted,
  markInviteUsed,
  markTripDeleted,
  ME_ID,
  migrate,
  seedIfEmpty,
  setLocalArchive,
  updateTripRow,
  updateUserProfile,
  writeFields,
} from '@/db';
import { openExpoDatabase } from '@/db/expo';
import { PACKING_ENTITY_TYPE, positionBetween } from '@/sync';

import { createId } from './ids';
import { packingTemplates } from './templates';
import type {
  Invite,
  JoinResult,
  MagicLink,
  Member,
  PackingDraft,
  PackingItem,
  PackingTemplateId,
  Session,
  StoreState,
  SyncStatus,
  Trip,
  TripDraft,
  VerifyResult,
} from './types';

const MAGIC_LINK_MS = 15 * 60 * 1000;
const INVITE_MS = 7 * 24 * 60 * 60 * 1000;
const RESTORED = 'Item restored, it was edited after being deleted.';

function emptyState(): StoreState {
  return {
    session: null,
    pendingEmail: null,
    magicLink: null,
    pendingJoin: null,
    users: [],
    trips: [],
    members: [],
    invites: [],
    packingItems: [],
    pendingMutations: 0,
    syncStatus: 'synced',
    resurrectionMessage: null,
    listError: null,
  };
}

let db: SqliteDb | null = null;
let state: StoreState = emptyState();
let online = true;
const listeners = new Set<() => void>();

function emit(): void {
  listeners.forEach((listener) => listener());
}

function setState(patch: Partial<StoreState> | ((_current: StoreState) => StoreState)): void {
  state = typeof patch === 'function' ? patch(state) : { ...state, ...patch };
  emit();
}

function requireDb(): SqliteDb {
  if (!db) {
    hydrate();
  }
  if (!db) {
    throw new Error('Database is not ready');
  }
  return db;
}

function syncStatusFor(pending: number): SyncStatus {
  if (pending === 0) {
    return 'synced';
  }
  return online ? 'syncing' : 'offline';
}

function reloadPersisted(): void {
  const persisted = loadPersisted(requireDb());
  setState({
    ...persisted,
    syncStatus: syncStatusFor(persisted.pendingMutations),
  });
}

export function hydrate(injected?: SqliteDb): void {
  if (db) {
    return;
  }
  db = injected ?? openExpoDatabase();
  migrate(db);
  seedIfEmpty(db);
  reloadPersisted();
}

export function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getState(): StoreState {
  return state;
}

export function setOnline(next: boolean): void {
  online = next;
  setState({ syncStatus: syncStatusFor(state.pendingMutations) });
}

function displayName(email: string): string {
  const local = email.split('@')[0] ?? 'You';
  return local.charAt(0).toUpperCase() + local.slice(1);
}

export function queueMagicLink(email: string): MagicLink {
  const magicLink: MagicLink = {
    email: email.trim().toLowerCase(),
    token: createId(),
    expiresAt: Date.now() + MAGIC_LINK_MS,
  };
  setState({ magicLink, pendingEmail: magicLink.email });
  return magicLink;
}

export function verifyMagicLink(token: string): VerifyResult {
  const { magicLink } = state;
  if (!magicLink || magicLink.token !== token) {
    return { ok: false, reason: 'invalid' };
  }
  if (Date.now() > magicLink.expiresAt) {
    return { ok: false, reason: 'expired' };
  }
  signIn(magicLink.email);
  return { ok: true };
}

export function signIn(email: string): Session {
  const normalized = email.trim().toLowerCase();
  const name = displayName(normalized);
  const session: Session = { userId: ME_ID, email: normalized, name };
  updateUserProfile(requireDb(), ME_ID, normalized, name);
  setState({
    session,
    pendingEmail: null,
    magicLink: null,
  });
  reloadPersisted();
  return session;
}

export function signOut(): void {
  setState({
    session: null,
    pendingEmail: null,
    magicLink: null,
    pendingJoin: null,
    resurrectionMessage: null,
  });
}

export function stashPendingJoin(tripId: string, token: string): void {
  setState({ pendingJoin: { tripId, token } });
}

export function takePendingJoin(): { tripId: string; token: string } | null {
  const pending = state.pendingJoin;
  if (pending) {
    setState({ pendingJoin: null });
  }
  return pending;
}

export function clearResurrection(): void {
  setState({ resurrectionMessage: null });
}

export function visibleTrips(archived: boolean): Trip[] {
  const userId = state.session?.userId;
  if (!userId) {
    return [];
  }
  return state.trips.filter((trip) => {
    if (trip.deleted) {
      return false;
    }
    const isMember = state.members.some(
      (member) => member.tripId === trip.id && member.userId === userId
    );
    if (!isMember) {
      return false;
    }
    return Boolean(trip.archivedBy[userId]) === archived;
  });
}

export function hasArchivedTrips(): boolean {
  return visibleTrips(true).length > 0;
}

export function getTrip(tripId: string): Trip | undefined {
  return state.trips.find((trip) => trip.id === tripId && !trip.deleted);
}

export function getMembers(tripId: string): Member[] {
  return state.members.filter((member) => member.tripId === tripId);
}

export function isOwner(tripId: string, userId = state.session?.userId): boolean {
  if (!userId) {
    return false;
  }
  return state.members.some(
    (member) => member.tripId === tripId && member.userId === userId && member.role === 'owner'
  );
}

export function getPackingItems(tripId: string): PackingItem[] {
  return state.packingItems
    .filter((entry) => entry.tripId === tripId && !entry.deleted)
    .slice()
    .sort((a, b) => a.position - b.position);
}

export function packingProgress(tripId: string): {
  packed: number;
  total: number;
  perMember: { name: string; packed: number; total: number }[];
} {
  const items = getPackingItems(tripId);
  const members = getMembers(tripId);
  const perMember = members
    .map((member) => {
      const assigned = items.filter((entry) => entry.assigneeId === member.userId);
      return {
        name: member.name,
        packed: assigned.filter((entry) => entry.packed).length,
        total: assigned.length,
      };
    })
    .filter((row) => row.total > 0);

  return {
    packed: items.filter((entry) => entry.packed).length,
    total: items.length,
    perMember,
  };
}

export function createTrip(draft: TripDraft): Trip {
  const session = state.session;
  if (!session) {
    throw new Error('Not signed in');
  }
  const trip: Trip = {
    id: createId(),
    name: draft.name.trim(),
    destination: draft.destination.trim(),
    startDate: draft.startDate,
    endDate: draft.endDate,
    emoji: draft.emoji?.trim() || undefined,
    coverUri: draft.coverUri,
    ownerId: session.userId,
    archivedBy: {},
    deleted: false,
  };
  const member: Member = {
    id: createId(),
    tripId: trip.id,
    userId: session.userId,
    role: 'owner',
    email: session.email,
    name: session.name,
  };
  const database = requireDb();
  insertTrip(database, trip);
  insertMember(database, member);
  reloadPersisted();
  return trip;
}

export function updateTrip(tripId: string, draft: Partial<TripDraft>): void {
  updateTripRow(requireDb(), tripId, draft);
  reloadPersisted();
}

export function setTripArchived(tripId: string, archived: boolean): void {
  const userId = state.session?.userId;
  if (!userId) {
    return;
  }
  setLocalArchive(requireDb(), tripId, userId, archived);
  reloadPersisted();
}

export function deleteTrip(tripId: string): void {
  markTripDeleted(requireDb(), tripId);
  reloadPersisted();
}

export function createInvite(tripId: string): Invite {
  const existing = state.invites.find(
    (invite) => invite.tripId === tripId && !invite.used && invite.expiresAt > Date.now()
  );
  if (existing) {
    return existing;
  }
  const invite: Invite = {
    id: createId(),
    tripId,
    token: createId(),
    expiresAt: Date.now() + INVITE_MS,
    used: false,
  };
  insertInvite(requireDb(), invite);
  reloadPersisted();
  return invite;
}

export function peekJoin(tripId: string, token: string): JoinResult {
  const session = state.session;
  const trip = getTrip(tripId);
  if (!trip) {
    return { ok: false, reason: 'missing' };
  }
  if (
    session &&
    state.members.some((member) => member.tripId === tripId && member.userId === session.userId)
  ) {
    return { ok: true, tripId, alreadyMember: true };
  }
  const invite = state.invites.find((entry) => entry.tripId === tripId && entry.token === token);
  if (!invite) {
    return { ok: false, reason: 'invalid' };
  }
  if (invite.used) {
    return { ok: false, reason: 'used' };
  }
  if (Date.now() > invite.expiresAt) {
    return { ok: false, reason: 'expired' };
  }
  return { ok: true, tripId, alreadyMember: false };
}

export function joinTrip(tripId: string, token: string): JoinResult {
  const preview = peekJoin(tripId, token);
  if (!preview.ok || preview.alreadyMember) {
    return preview;
  }
  const session = state.session;
  if (!session) {
    stashPendingJoin(tripId, token);
    return { ok: false, reason: 'invalid' };
  }
  const invite = state.invites.find((entry) => entry.tripId === tripId && entry.token === token);
  if (!invite) {
    return { ok: false, reason: 'invalid' };
  }
  const member: Member = {
    id: createId(),
    tripId,
    userId: session.userId,
    role: 'editor',
    email: session.email,
    name: session.name,
  };
  const database = requireDb();
  insertMember(database, member);
  markInviteUsed(database, invite.id);
  reloadPersisted();
  return { ok: true, tripId, alreadyMember: false };
}

export function removeMember(tripId: string, memberId: string): void {
  const member = state.members.find((entry) => entry.id === memberId && entry.tripId === tripId);
  if (!member || member.role === 'owner') {
    return;
  }
  const database = requireDb();
  deleteMemberRow(database, memberId);
  const assigned = state.packingItems.filter(
    (entry) => entry.tripId === tripId && entry.assigneeId === member.userId && !entry.deleted
  );
  for (const item of assigned) {
    writeFields(database, {
      entityId: item.id,
      tripId,
      entityType: PACKING_ENTITY_TYPE,
      changes: [{ field: 'assignee', value: null }],
    });
  }
  reloadPersisted();
}

function commitPacking(
  entityId: string,
  tripId: string,
  changes: FieldWrite[]
): { resurrected: boolean } {
  const result = writeFields(requireDb(), {
    entityId,
    tripId,
    entityType: PACKING_ENTITY_TYPE,
    changes,
  });
  reloadPersisted();
  if (result.resurrected) {
    setState({ resurrectionMessage: RESTORED });
  }
  return result;
}

export function addPackingItem(tripId: string, draft: PackingDraft): PackingItem {
  const id = createId();
  const ordered = getPackingItems(tripId);
  const last = ordered.length ? ordered[ordered.length - 1]!.position : null;
  const changes: FieldWrite[] = [
    { field: 'name', value: draft.name.trim() },
    { field: 'packed', value: false },
    { field: 'position', value: positionBetween(last, null) },
    { field: 'deleted', value: false },
  ];
  if (draft.quantity?.trim()) {
    changes.push({ field: 'quantity', value: draft.quantity.trim() });
  }
  if (draft.note?.trim()) {
    changes.push({ field: 'note', value: draft.note.trim() });
  }
  if (draft.assigneeId) {
    changes.push({ field: 'assignee', value: draft.assigneeId });
  }
  commitPacking(id, tripId, changes);
  const created = state.packingItems.find((entry) => entry.id === id);
  if (!created) {
    throw new Error('Failed to persist packing item');
  }
  return created;
}

export function applyPackingTemplate(tripId: string, templateId: PackingTemplateId): void {
  const existing = getPackingItems(tripId);
  let nextAfter = existing.length ? existing[0]!.position : null;
  const rows = [...packingTemplates[templateId]].reverse();
  for (const row of rows) {
    const position = positionBetween(null, nextAfter);
    nextAfter = position;
    const changes: FieldWrite[] = [
      { field: 'name', value: row.name },
      { field: 'packed', value: false },
      { field: 'position', value: position },
      { field: 'deleted', value: false },
    ];
    if (row.quantity) {
      changes.push({ field: 'quantity', value: row.quantity });
    }
    writeFields(requireDb(), {
      entityId: createId(),
      tripId,
      entityType: PACKING_ENTITY_TYPE,
      changes,
    });
  }
  reloadPersisted();
}

export function updatePackingItem(
  id: string,
  draft: Partial<PackingDraft> & { packed?: boolean }
): void {
  const current = state.packingItems.find((entry) => entry.id === id);
  if (!current) {
    return;
  }
  const changes: FieldWrite[] = [];
  if (draft.name !== undefined) {
    changes.push({ field: 'name', value: draft.name.trim() });
  }
  if (draft.quantity !== undefined) {
    changes.push({ field: 'quantity', value: draft.quantity.trim() || null });
  }
  if (draft.note !== undefined) {
    changes.push({ field: 'note', value: draft.note.trim() || null });
  }
  if (draft.assigneeId !== undefined) {
    changes.push({ field: 'assignee', value: draft.assigneeId || null });
  }
  if (draft.packed !== undefined) {
    changes.push({ field: 'packed', value: draft.packed });
  }
  commitPacking(id, current.tripId, changes);
}

export function setPacked(id: string, packed: boolean): void {
  updatePackingItem(id, { packed });
}

export function deletePackingItem(id: string): void {
  const current = state.packingItems.find((entry) => entry.id === id);
  if (!current) {
    return;
  }
  commitPacking(id, current.tripId, [{ field: 'deleted', value: true }]);
}

export function movePackingItem(id: string, direction: -1 | 1): void {
  const target = state.packingItems.find((entry) => entry.id === id);
  if (!target || target.deleted) {
    return;
  }
  const ordered = getPackingItems(target.tripId);
  const index = ordered.findIndex((entry) => entry.id === id);
  const neighbor = ordered[index + direction];
  if (!neighbor) {
    return;
  }
  const position =
    direction === 1
      ? positionBetween(neighbor.position, ordered[index + 2]?.position ?? null)
      : positionBetween(ordered[index - 2]?.position ?? null, neighbor.position);
  commitPacking(id, target.tripId, [{ field: 'position', value: position }]);
}

export const DEMO_JOIN = {
  tripId: LISBON_ID,
  token: DEMO_INVITE_TOKEN,
} as const;
