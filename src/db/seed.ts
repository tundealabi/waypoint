import { addDaysIso, todayIso } from '../lib/dates';
import type { Invite, Member, Trip, User } from '../store/types';
import { PACKING_ENTITY_TYPE } from '../sync';
import type { SqliteDb } from './driver';
import { insertInvite, insertMember, insertTrip, setLocalArchive, upsertUser } from './trips';
import { writeFields } from './write';

export const ME_ID = 'user-me';
export const SAM_ID = 'user-sam';
export const LISBON_ID = 'trip-lisbon';
export const TOKYO_ID = 'trip-tokyo';
export const DEMO_INVITE_TOKEN = 'lisbon-demo';

const INVITE_MS = 7 * 24 * 60 * 60 * 1000;

const me: User = { id: ME_ID, email: 'you@example.com', name: 'You' };
const sam: User = { id: SAM_ID, email: 'sam@example.com', name: 'Sam' };

export function seedIfEmpty(db: SqliteDb): void {
  const row = db.getFirst<{ n: number }>('SELECT COUNT(*) AS n FROM trips');
  if (Number(row?.n ?? 0) > 0) {
    return;
  }

  const start = addDaysIso(todayIso(), 18);
  const end = addDaysIso(start, 5);
  const tokyoStart = addDaysIso(todayIso(), -40);
  const tokyoEnd = addDaysIso(tokyoStart, 4);

  const lisbon: Trip = {
    id: LISBON_ID,
    name: 'Lisbon with Sam',
    destination: 'Lisbon, Portugal',
    startDate: start,
    endDate: end,
    emoji: '🇵🇹',
    ownerId: ME_ID,
    archivedBy: {},
    deleted: false,
  };
  const tokyo: Trip = {
    id: TOKYO_ID,
    name: 'Tokyo spring',
    destination: 'Tokyo, Japan',
    startDate: tokyoStart,
    endDate: tokyoEnd,
    emoji: '🇯🇵',
    ownerId: ME_ID,
    archivedBy: {},
    deleted: false,
  };

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

  const invite: Invite = {
    id: 'invite-lisbon',
    tripId: LISBON_ID,
    token: DEMO_INVITE_TOKEN,
    expiresAt: Date.now() + INVITE_MS,
    used: false,
  };

  db.withTransaction(() => {
    upsertUser(db, me);
    upsertUser(db, sam);
    insertTrip(db, lisbon);
    insertTrip(db, tokyo);
    for (const member of members) {
      insertMember(db, member);
    }
    insertInvite(db, invite);
    setLocalArchive(db, TOKYO_ID, ME_ID, true);
  });

  const packing: {
    name: string;
    position: number;
    packed?: boolean;
    assigneeId?: string;
    quantity?: string;
    note?: string;
  }[] = [
    { name: 'Passport', position: 0, packed: true, assigneeId: ME_ID },
    { name: 'Phone charger', position: 1, packed: true },
    { name: 'Walking shoes', position: 2, assigneeId: ME_ID },
    { name: 'Light jacket', position: 3, assigneeId: SAM_ID },
    { name: 'Sunscreen', position: 4, quantity: '1 bottle', assigneeId: SAM_ID },
    { name: 'Adapter', position: 5, note: 'EU plug' },
  ];

  for (const item of packing) {
    writeFields(db, {
      entityId: `seed-packing-${item.position}`,
      tripId: LISBON_ID,
      entityType: PACKING_ENTITY_TYPE,
      enqueue: false,
      changes: packingChanges(item),
    });
  }
}

function packingChanges(item: {
  name: string;
  position: number;
  packed?: boolean;
  assigneeId?: string;
  quantity?: string;
  note?: string;
}) {
  const changes: { field: string; value: unknown }[] = [
    { field: 'name', value: item.name },
    { field: 'packed', value: item.packed === true },
    { field: 'position', value: item.position },
    { field: 'deleted', value: false },
  ];
  if (item.quantity) {
    changes.push({ field: 'quantity', value: item.quantity });
  }
  if (item.note) {
    changes.push({ field: 'note', value: item.note });
  }
  if (item.assigneeId) {
    changes.push({ field: 'assignee', value: item.assigneeId });
  }
  return changes;
}
