import type {
  Contribution,
  Group,
  Invite,
  Membership,
  MockSpend,
  User,
} from '@/src/types';

import type { DataBackend } from '@/src/lib/supabase';

/**
 * Thin data-layer interface.
 *
 * Screens keep using the Zustand store for the invite → goal → daily $X loop.
 * Adapters let us swap in Supabase later without rewriting that loop.
 */
export interface TripPotRepository {
  readonly backend: DataBackend;

  getCurrentUser(): Promise<User | null>;
  listMyGroups(): Promise<Group[]>;
  listMemberships(groupId: string): Promise<Membership[]>;
  listContributions(groupId: string): Promise<Contribution[]>;
  listMockSpends(groupId: string): Promise<MockSpend[]>;
  listInvites(groupId: string): Promise<Invite[]>;
  savePushToken(userId: string, token: string | null): Promise<void>;
}
