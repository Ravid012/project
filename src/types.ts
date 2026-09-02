/**
 * TripPot domain types (MVP).
 * Amounts are USD cents. Card types are generic — post-MVP: Highnote/Unit.
 */

export type MembershipRole = 'owner' | 'member';

export interface User {
  id: string;
  appleId?: string | null;
  email: string;
  displayName: string;
  pushToken?: string | null;
  tz: string;
  createdAt: string; // ISO
}

export interface Group {
  id: string;
  name: string;
  emoji?: string | null;
  ownerId: string;
  goalCents: number;
  tripDate: string; // YYYY-MM-DD
  createdAt: string;
}

export interface Membership {
  id: string;
  groupId: string;
  userId: string;
  role: MembershipRole;
  joinedAt: string;
  muted?: boolean;
}

export interface Contribution {
  id: string;
  groupId: string;
  userId: string;
  amountCents: number;
  note?: string | null;
  createdAt: string;
}

/** Generic mock card spend — display-only until Highnote/Unit. */
export interface MockSpend {
  id: string;
  groupId: string;
  amountCents: number;
  note?: string | null;
  createdAt: string;
}

export interface Invite {
  id: string;
  groupId: string;
  code: string;
  expiresAt: string;
  createdBy: string;
}

export type DailyTargetStatus = 'goal_reached' | 'past_due' | 'on_track';

export type MemberStatus = 'caught_up' | 'behind';
