import type { StoreState } from '../store/types';
import type { SqliteDb } from './driver';
import { loadPackingItems } from './entities';
import { countUnsynced } from './outbox';
import { loadInvites, loadMembers, loadTrips, loadUsers } from './trips';

export type PersistedSlice = Pick<
  StoreState,
  'users' | 'trips' | 'members' | 'invites' | 'packingItems' | 'pendingMutations'
>;

export function loadPersisted(db: SqliteDb): PersistedSlice {
  return {
    users: loadUsers(db),
    trips: loadTrips(db),
    members: loadMembers(db),
    invites: loadInvites(db),
    packingItems: loadPackingItems(db),
    pendingMutations: countUnsynced(db),
  };
}
