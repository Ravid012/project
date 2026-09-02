import { useEffect, useRef } from 'react';

import { syncDailyReminders } from '@/src/notifications';
import { useAppStore } from '@/src/store';

/** Keeps local daily reminders in sync with pot math, mute, and goal_reached. */
export function useDailyReminders(): void {
  const currentUserId = useAppStore((s) => s.currentUserId);
  const dailyRemindersOptIn = useAppStore((s) => s.dailyRemindersOptIn);
  const groups = useAppStore((s) => s.groups);
  const memberships = useAppStore((s) => s.memberships);
  const contributions = useAppStore((s) => s.contributions);
  const mockSpends = useAppStore((s) => s.mockSpends);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      void syncDailyReminders({
        optIn: dailyRemindersOptIn,
        currentUserId,
        groups,
        memberships,
        contributions,
        mockSpends,
      });
    }, 250);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [currentUserId, dailyRemindersOptIn, groups, memberships, contributions, mockSpends]);
}
