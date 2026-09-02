import { getSupabaseClient } from '@/src/lib/supabase';
import { localRepository } from '@/src/data/localAdapter';
import type { TripPotRepository } from '@/src/data/repository';
import type { Contribution, Group, Invite, Membership, MockSpend, User } from '@/src/types';

/**
 * Remote adapter sketch. UI still defaults to Zustand until this is fully wired
 * (auth session, realtime merge, etc.). Methods no-op / fall back when the
 * client is missing or a query fails so a live project is not required.
 */
export const supabaseRepository: TripPotRepository = {
  backend: 'supabase',

  async getCurrentUser() {
    const client = getSupabaseClient();
    if (!client) return localRepository.getCurrentUser();
    const { data: sessionData } = await client.auth.getUser();
    const uid = sessionData.user?.id;
    if (!uid) return localRepository.getCurrentUser();
    const { data, error } = await client.from('profiles').select('*').eq('id', uid).maybeSingle();
    if (error || !data) return localRepository.getCurrentUser();
    return mapProfile(data);
  },

  async listMyGroups() {
    const client = getSupabaseClient();
    if (!client) return localRepository.listMyGroups();
    const { data, error } = await client.from('groups').select('*');
    if (error || !data) return localRepository.listMyGroups();
    return data.map(mapGroup);
  },

  async listMemberships(groupId) {
    const client = getSupabaseClient();
    if (!client) return localRepository.listMemberships(groupId);
    const { data, error } = await client.from('memberships').select('*').eq('group_id', groupId);
    if (error || !data) return localRepository.listMemberships(groupId);
    return data.map(mapMembership);
  },

  async listContributions(groupId) {
    const client = getSupabaseClient();
    if (!client) return localRepository.listContributions(groupId);
    const { data, error } = await client
      .from('contributions')
      .select('*')
      .eq('group_id', groupId)
      .order('created_at', { ascending: true });
    if (error || !data) return localRepository.listContributions(groupId);
    return data.map(mapContribution);
  },

  async listMockSpends(groupId) {
    const client = getSupabaseClient();
    if (!client) return localRepository.listMockSpends(groupId);
    const { data, error } = await client.from('mock_spends').select('*').eq('group_id', groupId);
    if (error || !data) return localRepository.listMockSpends(groupId);
    return data.map(mapMockSpend);
  },

  async listInvites(groupId) {
    const client = getSupabaseClient();
    if (!client) return localRepository.listInvites(groupId);
    const { data, error } = await client.from('invites').select('*').eq('group_id', groupId);
    if (error || !data) return localRepository.listInvites(groupId);
    return data.map(mapInvite);
  },

  async savePushToken(userId, token) {
    await localRepository.savePushToken(userId, token);
    const client = getSupabaseClient();
    if (!client) return;
    await client.from('profiles').update({ push_token: token }).eq('id', userId);
  },
};

function asString(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback;
}

function asNumber(value: unknown, fallback = 0): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function mapProfile(row: Record<string, unknown>): User {
  return {
    id: asString(row.id),
    appleId: row.apple_id == null ? null : asString(row.apple_id),
    email: asString(row.email),
    displayName: asString(row.display_name),
    pushToken: row.push_token == null ? null : asString(row.push_token),
    tz: asString(row.tz, 'America/New_York'),
    createdAt: asString(row.created_at),
  };
}

function mapGroup(row: Record<string, unknown>): Group {
  return {
    id: asString(row.id),
    name: asString(row.name),
    emoji: row.emoji == null ? null : asString(row.emoji),
    ownerId: asString(row.owner_id),
    goalCents: asNumber(row.goal_cents),
    tripDate: asString(row.trip_date),
    createdAt: asString(row.created_at),
  };
}

function mapMembership(row: Record<string, unknown>): Membership {
  return {
    id: asString(row.id),
    groupId: asString(row.group_id),
    userId: asString(row.user_id),
    role: row.role === 'owner' ? 'owner' : 'member',
    joinedAt: asString(row.joined_at),
    muted: Boolean(row.muted),
  };
}

function mapContribution(row: Record<string, unknown>): Contribution {
  return {
    id: asString(row.id),
    groupId: asString(row.group_id),
    userId: asString(row.user_id),
    amountCents: asNumber(row.amount_cents),
    note: row.note == null ? null : asString(row.note),
    createdAt: asString(row.created_at),
  };
}

function mapMockSpend(row: Record<string, unknown>): MockSpend {
  return {
    id: asString(row.id),
    groupId: asString(row.group_id),
    amountCents: asNumber(row.amount_cents),
    note: row.note == null ? null : asString(row.note),
    createdAt: asString(row.created_at),
  };
}

function mapInvite(row: Record<string, unknown>): Invite {
  return {
    id: asString(row.id),
    groupId: asString(row.group_id),
    code: asString(row.code),
    expiresAt: asString(row.expires_at),
    createdBy: asString(row.created_by),
  };
}
