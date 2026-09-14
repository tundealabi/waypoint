export type Role = 'owner' | 'editor';

export type SyncStatus = 'synced' | 'syncing' | 'offline';

export type Session = {
  userId: string;
  email: string;
  name: string;
};

export type User = {
  id: string;
  email: string;
  name: string;
};

export type Trip = {
  id: string;
  name: string;
  destination: string;
  startDate: string;
  endDate: string;
  emoji?: string;
  coverUri?: string;
  ownerId: string;
  archivedBy: Record<string, boolean>;
  deleted: boolean;
};

export type Member = {
  id: string;
  tripId: string;
  userId: string;
  role: Role;
  email: string;
  name: string;
};

export type Invite = {
  id: string;
  tripId: string;
  token: string;
  expiresAt: number;
  used: boolean;
};

export type PackingItem = {
  id: string;
  tripId: string;
  name: string;
  quantity?: string;
  note?: string;
  assigneeId?: string;
  packed: boolean;
  position: number;
  deleted: boolean;
};

export type MagicLink = {
  email: string;
  token: string;
  expiresAt: number;
};

export type PendingJoin = {
  tripId: string;
  token: string;
};

export type TripDraft = {
  name: string;
  destination: string;
  startDate: string;
  endDate: string;
  emoji?: string;
  coverUri?: string;
};

export type PackingDraft = {
  name: string;
  quantity?: string;
  note?: string;
  assigneeId?: string;
};

export type PackingTemplateId = 'beach' | 'city' | 'camping';

export type StoreState = {
  session: Session | null;
  pendingEmail: string | null;
  magicLink: MagicLink | null;
  pendingJoin: PendingJoin | null;
  users: User[];
  trips: Trip[];
  members: Member[];
  invites: Invite[];
  packingItems: PackingItem[];
  pendingMutations: number;
  syncStatus: SyncStatus;
  resurrectionMessage: string | null;
  listError: string | null;
};

export type JoinResult =
  | { ok: true; tripId: string; alreadyMember: boolean }
  | { ok: false; reason: 'invalid' | 'expired' | 'used' | 'missing' };

export type VerifyResult = { ok: true } | { ok: false; reason: 'invalid' | 'expired' };
