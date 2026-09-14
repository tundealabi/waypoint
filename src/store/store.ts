import { addDaysIso, todayIso } from '@/lib/dates';

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
  Trip,
  TripDraft,
  User,
  VerifyResult,
} from './types';

const ME_ID = 'user-me';
const SAM_ID = 'user-sam';
const LISBON_ID = 'trip-lisbon';
const TOKYO_ID = 'trip-tokyo';
const MAGIC_LINK_MS = 15 * 60 * 1000;
const INVITE_MS = 7 * 24 * 60 * 60 * 1000;
const DRAIN_MS = 650;

const me: User = { id: ME_ID, email: 'you@example.com', name: 'You' };
const sam: User = { id: SAM_ID, email: 'sam@example.com', name: 'Sam' };

function seedState(): StoreState {
  const start = addDaysIso(todayIso(), 18);
  const end = addDaysIso(start, 5);
  const tokyoStart = addDaysIso(todayIso(), -40);
  const tokyoEnd = addDaysIso(tokyoStart, 4);

  const trips: Trip[] = [
    {
      id: LISBON_ID,
      name: 'Lisbon with Sam',
      destination: 'Lisbon, Portugal',
      startDate: start,
      endDate: end,
      emoji: '🇵🇹',
      ownerId: ME_ID,
      archivedBy: {},
      deleted: false,
    },
    {
      id: TOKYO_ID,
      name: 'Tokyo spring',
      destination: 'Tokyo, Japan',
      startDate: tokyoStart,
      endDate: tokyoEnd,
      emoji: '🇯🇵',
      ownerId: ME_ID,
      archivedBy: { [ME_ID]: true },
      deleted: false,
    },
  ];

  const members: Member[] = [
    {
      id: 'member-lisbon-me',
      tripId: LISBON_ID,
      userId: ME_ID,
      role: 'owner',
      email: me.email,
      name: me.name,
    },
    {
      id: 'member-lisbon-sam',
      tripId: LISBON_ID,
      userId: SAM_ID,
      role: 'editor',
      email: sam.email,
      name: sam.name,
    },
    {
      id: 'member-tokyo-me',
      tripId: TOKYO_ID,
      userId: ME_ID,
      role: 'owner',
      email: me.email,
      name: me.name,
    },
  ];

  const packingItems: PackingItem[] = [
    item(LISBON_ID, 'Passport', 0, { packed: true, assigneeId: ME_ID }),
    item(LISBON_ID, 'Phone charger', 1, { packed: true }),
    item(LISBON_ID, 'Walking shoes', 2, { assigneeId: ME_ID }),
    item(LISBON_ID, 'Light jacket', 3, { assigneeId: SAM_ID }),
    item(LISBON_ID, 'Sunscreen', 4, { quantity: '1 bottle', assigneeId: SAM_ID }),
    item(LISBON_ID, 'Adapter', 5, { note: 'EU plug' }),
  ];

  return {
    session: null,
    pendingEmail: null,
    magicLink: null,
    pendingJoin: null,
    users: [me, sam],
    trips,
    members,
    invites: [
      {
        id: 'invite-lisbon',
        tripId: LISBON_ID,
        token: 'lisbon-demo',
        expiresAt: Date.now() + INVITE_MS,
        used: false,
      },
    ],
    packingItems,
    pendingMutations: 0,
    syncStatus: 'synced',
    resurrectionMessage: null,
    listError: null,
  };
}

function item(
  tripId: string,
  name: string,
  position: number,
  extra: Partial<PackingItem> = {}
): PackingItem {
  return {
    id: createId(),
    tripId,
    name,
    packed: false,
    position,
    deleted: false,
    ...extra,
  };
}

let state: StoreState = seedState();
const listeners = new Set<() => void>();
let drainTimer: ReturnType<typeof setTimeout> | null = null;
let online = true;

function emit(): void {
  listeners.forEach((listener) => listener());
}

function setState(patch: Partial<StoreState> | ((_current: StoreState) => StoreState)): void {
  state = typeof patch === 'function' ? patch(state) : { ...state, ...patch };
  emit();
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
  if (next) {
    if (state.pendingMutations > 0) {
      setState({ syncStatus: 'syncing' });
      scheduleDrain();
    } else {
      setState({ syncStatus: 'synced' });
    }
    return;
  }
  setState({
    syncStatus: state.pendingMutations > 0 ? 'offline' : 'synced',
  });
}

function noteLocalWrite(): void {
  const pendingMutations = state.pendingMutations + 1;
  if (online) {
    setState({ pendingMutations, syncStatus: 'syncing' });
    scheduleDrain();
    return;
  }
  setState({ pendingMutations, syncStatus: 'offline' });
}

function scheduleDrain(): void {
  if (drainTimer) {
    clearTimeout(drainTimer);
  }
  drainTimer = setTimeout(() => {
    drainTimer = null;
    setState({
      pendingMutations: 0,
      syncStatus: online ? 'synced' : 'offline',
    });
  }, DRAIN_MS);
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
  setState((current) => ({
    ...current,
    session,
    pendingEmail: null,
    magicLink: null,
    users: current.users.map((user) =>
      user.id === ME_ID ? { ...user, email: normalized, name } : user
    ),
    members: current.members.map((member) =>
      member.userId === ME_ID ? { ...member, email: normalized, name } : member
    ),
  }));
  return session;
}

export function signOut(): void {
  setState({
    session: null,
    pendingEmail: null,
    magicLink: null,
    pendingJoin: null,
    pendingMutations: 0,
    syncStatus: 'synced',
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
  setState((current) => ({
    ...current,
    trips: [trip, ...current.trips],
    members: [...current.members, member],
  }));
  noteLocalWrite();
  return trip;
}

export function updateTrip(tripId: string, draft: Partial<TripDraft>): void {
  setState((current) => ({
    ...current,
    trips: current.trips.map((trip) =>
      trip.id === tripId
        ? {
            ...trip,
            name: draft.name?.trim() ?? trip.name,
            destination: draft.destination?.trim() ?? trip.destination,
            startDate: draft.startDate ?? trip.startDate,
            endDate: draft.endDate ?? trip.endDate,
            emoji: draft.emoji !== undefined ? draft.emoji.trim() || undefined : trip.emoji,
            coverUri: draft.coverUri !== undefined ? draft.coverUri : trip.coverUri,
          }
        : trip
    ),
  }));
  noteLocalWrite();
}

export function setTripArchived(tripId: string, archived: boolean): void {
  const userId = state.session?.userId;
  if (!userId) {
    return;
  }
  setState((current) => ({
    ...current,
    trips: current.trips.map((trip) =>
      trip.id === tripId
        ? { ...trip, archivedBy: { ...trip.archivedBy, [userId]: archived } }
        : trip
    ),
  }));
}

export function deleteTrip(tripId: string): void {
  setState((current) => ({
    ...current,
    trips: current.trips.map((trip) => (trip.id === tripId ? { ...trip, deleted: true } : trip)),
  }));
  noteLocalWrite();
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
  setState((current) => ({ ...current, invites: [...current.invites, invite] }));
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
  setState((current) => ({
    ...current,
    members: [...current.members, member],
    invites: current.invites.map((entry) =>
      entry.id === invite.id ? { ...entry, used: true } : entry
    ),
  }));
  noteLocalWrite();
  return { ok: true, tripId, alreadyMember: false };
}

export function removeMember(tripId: string, memberId: string): void {
  const member = state.members.find((entry) => entry.id === memberId && entry.tripId === tripId);
  if (!member || member.role === 'owner') {
    return;
  }
  setState((current) => ({
    ...current,
    members: current.members.filter((entry) => entry.id !== memberId),
    packingItems: current.packingItems.map((entry) =>
      entry.assigneeId === member.userId ? { ...entry, assigneeId: undefined } : entry
    ),
  }));
  noteLocalWrite();
}

export function addPackingItem(tripId: string, draft: PackingDraft): PackingItem {
  const positions = getPackingItems(tripId).map((entry) => entry.position);
  const packingItem: PackingItem = {
    id: createId(),
    tripId,
    name: draft.name.trim(),
    quantity: draft.quantity?.trim() || undefined,
    note: draft.note?.trim() || undefined,
    assigneeId: draft.assigneeId || undefined,
    packed: false,
    position: positions.length ? Math.max(...positions) + 1 : 0,
    deleted: false,
  };
  setState((current) => ({ ...current, packingItems: [...current.packingItems, packingItem] }));
  noteLocalWrite();
  return packingItem;
}

export function applyPackingTemplate(tripId: string, templateId: PackingTemplateId): void {
  const existing = getPackingItems(tripId);
  const min = existing.length ? Math.min(...existing.map((entry) => entry.position)) : 0;
  const rows = packingTemplates[templateId].map((entry, index) =>
    item(tripId, entry.name, min - packingTemplates[templateId].length + index, {
      quantity: entry.quantity,
    })
  );
  setState((current) => ({ ...current, packingItems: [...rows, ...current.packingItems] }));
  noteLocalWrite();
}

export function updatePackingItem(
  id: string,
  draft: Partial<PackingDraft> & { packed?: boolean }
): void {
  let resurrected = false;
  setState((current) => ({
    ...current,
    packingItems: current.packingItems.map((entry) => {
      if (entry.id !== id) {
        return entry;
      }
      if (entry.deleted) {
        resurrected = true;
      }
      return {
        ...entry,
        deleted: false,
        name: draft.name?.trim() ?? entry.name,
        quantity:
          draft.quantity !== undefined ? draft.quantity.trim() || undefined : entry.quantity,
        note: draft.note !== undefined ? draft.note.trim() || undefined : entry.note,
        assigneeId:
          draft.assigneeId !== undefined ? draft.assigneeId || undefined : entry.assigneeId,
        packed: draft.packed ?? entry.packed,
      };
    }),
    resurrectionMessage: resurrected
      ? 'Item restored, it was edited after being deleted.'
      : current.resurrectionMessage,
  }));
  noteLocalWrite();
}

export function setPacked(id: string, packed: boolean): void {
  updatePackingItem(id, { packed });
}

export function deletePackingItem(id: string): void {
  setState((current) => ({
    ...current,
    packingItems: current.packingItems.map((entry) =>
      entry.id === id ? { ...entry, deleted: true } : entry
    ),
  }));
  noteLocalWrite();
}

export function movePackingItem(id: string, direction: -1 | 1): void {
  const target = state.packingItems.find((entry) => entry.id === id);
  if (!target) {
    return;
  }
  const ordered = getPackingItems(target.tripId);
  const index = ordered.findIndex((entry) => entry.id === id);
  const swapWith = ordered[index + direction];
  if (!swapWith) {
    return;
  }
  const nextPosition = swapWith.position;
  const currentPosition = ordered[index]!.position;
  setState((current) => ({
    ...current,
    packingItems: current.packingItems.map((entry) => {
      if (entry.id === id) {
        return { ...entry, position: nextPosition };
      }
      if (entry.id === swapWith.id) {
        return { ...entry, position: currentPosition };
      }
      return entry;
    }),
  }));
  noteLocalWrite();
}

export const DEMO_JOIN = {
  tripId: LISBON_ID,
  token: 'lisbon-demo',
} as const;
