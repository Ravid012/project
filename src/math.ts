import { differenceInCalendarDays, parseISO, startOfDay } from 'date-fns';
import type { Contribution, MockSpend, DailyTargetStatus } from './types';

export function formatUsd(cents: number): string {
  const sign = cents < 0 ? '-' : '';
  const abs = Math.abs(cents);
  const dollars = Math.floor(abs / 100);
  const rem = abs % 100;
  return `${sign}$${dollars.toLocaleString('en-US')}.${rem.toString().padStart(2, '0')}`;
}

/** Whole-dollar display for daily copy (matches product copy style). */
export function formatUsdWhole(cents: number): string {
  const dollars = Math.round(cents / 100);
  return `$${dollars.toLocaleString('en-US')}`;
}

export function dollarsToCents(dollars: number): number {
  if (!Number.isFinite(dollars)) return 0;
  return Math.round(dollars * 100);
}

export function parseDollarsToCents(text: string): number | null {
  const cleaned = text.replace(/[^0-9.]/g, '');
  if (!cleaned) return null;
  const n = Number.parseFloat(cleaned);
  if (!Number.isFinite(n) || n < 0) return null;
  return dollarsToCents(n);
}

export function sumContributions(items: Contribution[], groupId: string): number {
  return items.filter((c) => c.groupId === groupId).reduce((s, c) => s + c.amountCents, 0);
}

export function sumMockSpends(items: MockSpend[], groupId: string): number {
  return items.filter((s) => s.groupId === groupId).reduce((s, x) => s + x.amountCents, 0);
}

/** pot = sum(contrib) - sum(mockSpends) */
export function computePot(contribSum: number, spendSum: number): number {
  return contribSum - spendSum;
}

/** Calendar days from today to tripDate. Can be negative (past). */
export function computeDaysLeft(tripDate: string, now: Date = new Date()): number {
  const trip = startOfDay(parseISO(tripDate));
  const today = startOfDay(now);
  return differenceInCalendarDays(trip, today);
}

export interface DailyTargetResult {
  pot: number;
  remaining: number;
  daysLeft: number;
  dailyTarget: number;
  status: DailyTargetStatus;
  copy: string;
  percentFunded: number;
}

/**
 * Daily save math (product-locked):
 * - pot = sum(contrib) - sum(mockSpends)
 * - remaining = max(0, goal - pot)
 * - remaining <= 0 → dailyTarget=0, status=goal_reached
 * - else daysLeft <= 0 → dailyTarget=remaining, status=past_due
 * - else dailyTarget = ceil(remaining / daysLeft / memberCount), status=on_track
 */
export function computeDailyTarget(input: {
  goalCents: number;
  contributions: Contribution[];
  mockSpends: MockSpend[];
  groupId: string;
  tripDate: string;
  memberCount: number;
  now?: Date;
}): DailyTargetResult {
  const contribSum = sumContributions(input.contributions, input.groupId);
  const spendSum = sumMockSpends(input.mockSpends, input.groupId);
  const pot = computePot(contribSum, spendSum);
  const remaining = Math.max(0, input.goalCents - pot);
  const daysLeft = computeDaysLeft(input.tripDate, input.now ?? new Date());
  const memberCount = Math.max(1, input.memberCount);
  const percentFunded =
    input.goalCents <= 0
      ? 100
      : Math.min(100, Math.round((Math.max(0, pot) / input.goalCents) * 100));

  if (remaining <= 0) {
    return {
      pot,
      remaining: 0,
      daysLeft,
      dailyTarget: 0,
      status: 'goal_reached',
      copy: 'Goal reached',
      percentFunded,
    };
  }

  if (daysLeft <= 0) {
    return {
      pot,
      remaining,
      daysLeft,
      dailyTarget: remaining,
      status: 'past_due',
      copy: `Trip date passed — ${formatUsdWhole(remaining)} still to go`,
      percentFunded,
    };
  }

  const dailyTarget = Math.ceil(remaining / Math.max(1, daysLeft) / memberCount);
  return {
    pot,
    remaining,
    daysLeft,
    dailyTarget,
    status: 'on_track',
    copy: `Deposit ${formatUsdWhole(dailyTarget)} today`,
    percentFunded,
  };
}

/** Local reminder body. Null means suppress (goal reached). */
export function buildReminderBody(input: {
  status: DailyTargetStatus;
  dailyTarget: number;
  copy: string;
}): string | null {
  if (input.status === 'goal_reached') return null;
  if (input.status === 'past_due') {
    return `${input.copy}; Catch up — deposit ${formatUsdWhole(input.dailyTarget)}`;
  }
  return input.copy;
}
