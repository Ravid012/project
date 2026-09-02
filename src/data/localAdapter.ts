import { useAppStore } from '@/src/store';
import type { TripPotRepository } from '@/src/data/repository';

/** Default adapter: Zustand + AsyncStorage. Used when Supabase env keys are missing. */
export const localRepository: TripPotRepository = {
  backend: 'local',

  async getCurrentUser() {
    return useAppStore.getState().getCurrentUser();
  },

  async listMyGroups() {
    return useAppStore.getState().getMyGroups();
  },

  async listMemberships(groupId) {
    return useAppStore.getState().memberships.filter((m) => m.groupId === groupId);
  },

  async listContributions(groupId) {
    return useAppStore.getState().contributions.filter((c) => c.groupId === groupId);
  },

  async listMockSpends(groupId) {
    return useAppStore.getState().mockSpends.filter((s) => s.groupId === groupId);
  },

  async listInvites(groupId) {
    return useAppStore.getState().invites.filter((i) => i.groupId === groupId);
  },

  async savePushToken(userId, token) {
    useAppStore.getState().setPushToken(userId, token);
  },
};
