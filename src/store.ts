import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import type {
  Contribution,
  Group,
  Invite,
  Membership,
  MockSpend,
  User,
} from './types';

/**
 * Local Zustand store — default data layer when Supabase env keys are missing.
 * See src/data for the thin repository adapter (local vs supabase).
 */

const DEMO_USER_ID = 'user_demo';
const DEMO_FRIEND_ID = 'user_demo_friend';
const STORAGE_KEY = 'trippot-v1';

function createId(prefix: string): string {
  const rand =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID().replace(/-/g, '').slice(0, 12)
      : `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
  return `${prefix}_${rand}`;
}

function createInviteCode(): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return code;
}

export interface AppState {
  hydrated: boolean;
  currentUserId: string | null;
  users: User[];
  groups: Group[];
  memberships: Membership[];
  contributions: Contribution[];
  mockSpends: MockSpend[];
  invites: Invite[];
  /** User opted into local daily reminders from Settings. */
  dailyRemindersOptIn: boolean;

  setHydrated: (v: boolean) => void;
  setDailyRemindersOptIn: (v: boolean) => void;
  setPushToken: (userId: string, token: string | null) => void;
  setMuted: (groupId: string, muted: boolean) => void;
  ingestContribution: (contribution: Contribution) => void;

  signInWithEmail: (
    email: string,
    password: string,
    displayName?: string
  ) => { ok: true } | { ok: false; error: string };
  /** TODO: wire expo-apple-authentication for App Store */
  signInWithAppleStub: () => void;
  signOut: () => void;
  /** App Store account deletion — wipe local user data */
  deleteAccount: () => void;

  createGroup: (input: {
    name: string;
    emoji?: string;
    goalCents: number;
    tripDate: string;
  }) => { group: Group; invite: Invite };
  updateGroup: (
    groupId: string,
    patch: Partial<Pick<Group, 'name' | 'emoji' | 'goalCents' | 'tripDate'>>
  ) => { ok: true } | { ok: false; error: string };
  joinWithCode: (
    code: string
  ) => { ok: true; groupId: string } | { ok: false; error: string };
  ensureInvite: (groupId: string) => Invite;
  leaveGroup: (groupId: string) => { ok: true } | { ok: false; error: string };
  deleteGroup: (groupId: string) => { ok: true } | { ok: false; error: string };
  toggleMute: (groupId: string) => void;
  addDemoMember: (groupId: string) => void;

  logContribution: (groupId: string, amountCents: number, note?: string) => Contribution;
  logMockSpend: (groupId: string, amountCents: number, note?: string) => MockSpend;

  getCurrentUser: () => User | null;
  getMyGroups: () => Group[];
}

function seedUsers(): User[] {
  const now = new Date().toISOString();
  return [
    {
      id: DEMO_USER_ID,
      email: 'demo@trippot.app',
      displayName: 'Jordan Demo',
      tz: 'America/New_York',
      createdAt: now,
    },
    {
      id: DEMO_FRIEND_ID,
      email: 'alex@trippot.app',
      displayName: 'Alex Friend',
      tz: 'America/New_York',
      createdAt: now,
    },
  ];
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      hydrated: false,
      currentUserId: null,
      users: seedUsers(),
      groups: [],
      memberships: [],
      contributions: [],
      mockSpends: [],
      invites: [],
      dailyRemindersOptIn: false,

      setHydrated: (v) => set({ hydrated: v }),
      setDailyRemindersOptIn: (v) => set({ dailyRemindersOptIn: v }),

      setPushToken: (userId, token) => {
        set((s) => ({
          users: s.users.map((u) => (u.id === userId ? { ...u, pushToken: token } : u)),
        }));
      },

      ingestContribution: (contribution) => {
        set((s) => {
          if (s.contributions.some((c) => c.id === contribution.id)) return s;
          return { contributions: [...s.contributions, contribution] };
        });
      },

      getCurrentUser: () => {
        const { currentUserId, users } = get();
        if (!currentUserId) return null;
        return users.find((u) => u.id === currentUserId) ?? null;
      },

      getMyGroups: () => {
        const { currentUserId, memberships, groups } = get();
        if (!currentUserId) return [];
        const ids = new Set(
          memberships.filter((m) => m.userId === currentUserId).map((m) => m.groupId)
        );
        return groups.filter((g) => ids.has(g.id));
      },

      signInWithEmail: (email, password, displayName) => {
        const trimmed = email.trim().toLowerCase();
        if (!trimmed.includes('@')) {
          return { ok: false, error: 'Enter a valid email' };
        }
        if (password.length < 4) {
          return { ok: false, error: 'Password must be at least 4 characters (demo)' };
        }
        const existing = get().users.find((u) => u.email.toLowerCase() === trimmed);
        if (existing) {
          set({ currentUserId: existing.id });
          return { ok: true };
        }
        const user: User = {
          id: createId('user'),
          email: trimmed,
          displayName: displayName?.trim() || trimmed.split('@')[0],
          tz: Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/New_York',
          createdAt: new Date().toISOString(),
        };
        set((s) => ({ users: [...s.users, user], currentUserId: user.id }));
        return { ok: true };
      },

      signInWithAppleStub: () => {
        // TODO: expo-apple-authentication + backend when keys exist
        const appleEmail = 'apple.demo@trippot.app';
        let user = get().users.find((u) => u.email === appleEmail);
        if (!user) {
          user = {
            id: createId('user'),
            appleId: 'apple_stub_' + createId('aid'),
            email: appleEmail,
            displayName: 'Apple Demo',
            tz: Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/New_York',
            createdAt: new Date().toISOString(),
          };
          set((s) => ({ users: [...s.users, user!] }));
        }
        set({ currentUserId: user.id });
      },

      signOut: () => set({ currentUserId: null }),

      deleteAccount: () => {
        const uid = get().currentUserId;
        if (!uid) return;
        const ownedGroupIds = new Set(
          get()
            .memberships.filter((m) => m.userId === uid && m.role === 'owner')
            .map((m) => m.groupId)
        );
        set((s) => ({
          currentUserId: null,
          users: s.users.filter((u) => u.id !== uid),
          groups: s.groups.filter((g) => !ownedGroupIds.has(g.id)),
          memberships: s.memberships.filter(
            (m) => m.userId !== uid && !ownedGroupIds.has(m.groupId)
          ),
          contributions: s.contributions.filter(
            (c) => c.userId !== uid && !ownedGroupIds.has(c.groupId)
          ),
          mockSpends: s.mockSpends.filter((ms) => !ownedGroupIds.has(ms.groupId)),
          invites: s.invites.filter((i) => !ownedGroupIds.has(i.groupId)),
        }));
      },

      createGroup: ({ name, emoji, goalCents, tripDate }) => {
        const uid = get().currentUserId;
        if (!uid) throw new Error('Not signed in');
        const group: Group = {
          id: createId('grp'),
          name: name.trim(),
          emoji: emoji || '✈️',
          ownerId: uid,
          goalCents,
          tripDate,
          createdAt: new Date().toISOString(),
        };
        const membership: Membership = {
          id: createId('mem'),
          groupId: group.id,
          userId: uid,
          role: 'owner',
          joinedAt: new Date().toISOString(),
          muted: false,
        };
        const invite: Invite = {
          id: createId('inv'),
          groupId: group.id,
          code: createInviteCode(),
          expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30).toISOString(),
          createdBy: uid,
        };
        set((s) => ({
          groups: [...s.groups, group],
          memberships: [...s.memberships, membership],
          invites: [...s.invites, invite],
        }));
        return { group, invite };
      },

      updateGroup: (groupId, patch) => {
        const uid = get().currentUserId;
        const group = get().groups.find((g) => g.id === groupId);
        if (!uid || !group || group.ownerId !== uid) {
          return { ok: false, error: 'Only the owner can edit' };
        }
        set((s) => ({
          groups: s.groups.map((g) => (g.id === groupId ? { ...g, ...patch } : g)),
        }));
        return { ok: true };
      },

      ensureInvite: (groupId) => {
        const existing = get().invites.find(
          (i) => i.groupId === groupId && new Date(i.expiresAt) > new Date()
        );
        if (existing) return existing;
        const uid = get().currentUserId!;
        const invite: Invite = {
          id: createId('inv'),
          groupId,
          code: createInviteCode(),
          expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30).toISOString(),
          createdBy: uid,
        };
        set((s) => ({ invites: [...s.invites, invite] }));
        return invite;
      },

      joinWithCode: (rawCode) => {
        const uid = get().currentUserId;
        if (!uid) return { ok: false, error: 'Sign in first' };
        const code = rawCode.trim().toUpperCase();
        const invite = get().invites.find((i) => i.code.toUpperCase() === code);
        if (!invite) return { ok: false, error: 'Invalid invite code' };
        if (new Date(invite.expiresAt) < new Date()) {
          return { ok: false, error: 'Invite expired' };
        }
        const already = get().memberships.some(
          (m) => m.groupId === invite.groupId && m.userId === uid
        );
        if (already) return { ok: true, groupId: invite.groupId };
        const membership: Membership = {
          id: createId('mem'),
          groupId: invite.groupId,
          userId: uid,
          role: 'member',
          joinedAt: new Date().toISOString(),
          muted: false,
        };
        set((s) => ({ memberships: [...s.memberships, membership] }));
        return { ok: true, groupId: invite.groupId };
      },

      toggleMute: (groupId) => {
        const uid = get().currentUserId;
        if (!uid) return;
        set((s) => ({
          memberships: s.memberships.map((m) =>
            m.groupId === groupId && m.userId === uid ? { ...m, muted: !m.muted } : m
          ),
        }));
      },

      setMuted: (groupId, muted) => {
        const uid = get().currentUserId;
        if (!uid) return;
        set((s) => ({
          memberships: s.memberships.map((m) =>
            m.groupId === groupId && m.userId === uid ? { ...m, muted } : m
          ),
        }));
      },

      addDemoMember: (groupId) => {
        const friend = get().users.find((u) => u.id === DEMO_FRIEND_ID);
        if (!friend) return;
        const already = get().memberships.some(
          (m) => m.groupId === groupId && m.userId === friend.id
        );
        if (already) return;
        set((s) => ({
          memberships: [
            ...s.memberships,
            {
              id: createId('mem'),
              groupId,
              userId: friend.id,
              role: 'member',
              joinedAt: new Date().toISOString(),
              muted: false,
            },
          ],
        }));
      },

      leaveGroup: (groupId) => {
        const uid = get().currentUserId;
        if (!uid) return { ok: false, error: 'Not signed in' };
        const mem = get().memberships.find((m) => m.groupId === groupId && m.userId === uid);
        if (!mem) return { ok: false, error: 'Not a member' };
        if (mem.role === 'owner') {
          return { ok: false, error: 'Owner cannot leave — delete the group instead' };
        }
        set((s) => ({
          memberships: s.memberships.filter((m) => m.id !== mem.id),
        }));
        return { ok: true };
      },

      deleteGroup: (groupId) => {
        const uid = get().currentUserId;
        if (!uid) return { ok: false, error: 'Not signed in' };
        const group = get().groups.find((g) => g.id === groupId);
        if (!group || group.ownerId !== uid) {
          return { ok: false, error: 'Only the owner can delete' };
        }
        const members = get().memberships.filter((m) => m.groupId === groupId);
        if (members.length > 1) {
          return {
            ok: false,
            error: 'Owner can delete an empty group only (no other members)',
          };
        }
        set((s) => ({
          groups: s.groups.filter((g) => g.id !== groupId),
          memberships: s.memberships.filter((m) => m.groupId !== groupId),
          contributions: s.contributions.filter((c) => c.groupId !== groupId),
          mockSpends: s.mockSpends.filter((ms) => ms.groupId !== groupId),
          invites: s.invites.filter((i) => i.groupId !== groupId),
        }));
        return { ok: true };
      },

      logContribution: (groupId, amountCents, note) => {
        const uid = get().currentUserId;
        if (!uid) throw new Error('Not signed in');
        const contribution: Contribution = {
          id: createId('cbt'),
          groupId,
          userId: uid,
          amountCents,
          note: note?.trim() || undefined,
          createdAt: new Date().toISOString(),
        };
        set((s) => ({ contributions: [...s.contributions, contribution] }));
        return contribution;
      },

      logMockSpend: (groupId, amountCents, note) => {
        const spend: MockSpend = {
          id: createId('spd'),
          groupId,
          amountCents,
          note: note?.trim() || undefined,
          createdAt: new Date().toISOString(),
        };
        set((s) => ({ mockSpends: [...s.mockSpends, spend] }));
        return spend;
      },
    }),
    {
      name: STORAGE_KEY,
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s) => ({
        currentUserId: s.currentUserId,
        users: s.users,
        groups: s.groups,
        memberships: s.memberships,
        contributions: s.contributions,
        mockSpends: s.mockSpends,
        invites: s.invites,
        dailyRemindersOptIn: s.dailyRemindersOptIn,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated(true);
      },
    }
  )
);
