import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { buildReminderBody, computeDailyTarget } from '@/src/math';
import type { Contribution, DailyTargetStatus, Group, Membership, MockSpend } from '@/src/types';

const ANDROID_CHANNEL_ID = 'daily-reminders';
const REMINDER_ID_PREFIX = 'trippot-daily-';
const REMINDER_HOUR = 9;
const REMINDER_MINUTE = 0;

export type PermissionResult = {
  granted: boolean;
  status: Notifications.PermissionStatus | 'unavailable';
  token: string | null;
  message: string;
};

function nativeNotificationsAvailable(): boolean {
  return Platform.OS === 'ios' || Platform.OS === 'android';
}

if (nativeNotificationsAvailable()) {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldPlaySound: false,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}

export function reminderIdentifier(groupId: string): string {
  return `${REMINDER_ID_PREFIX}${groupId}`;
}

export { buildReminderBody } from '@/src/math';

export const PERMISSION_COPY = {
  intro:
    'Optional: one local reminder per trip pot each morning, using the same daily amount already shown in the app. We skip muted pots and never notify after Goal reached. No marketing, no extra pings.',
  web: 'Daily reminders run on iOS and Android. This web preview cannot schedule device notifications.',
  granted: 'Reminders are on. At most one per pot, around 9:00 AM local time.',
  denied:
    'Notifications are off. TripPot will not ask again unless you tap Enable. You can also allow them later in system Settings.',
  unavailable: 'Notifications are not available on this device.',
} as const;

async function ensureAndroidChannel(): Promise<void> {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync(ANDROID_CHANNEL_ID, {
    name: 'Daily deposit reminders',
    importance: Notifications.AndroidImportance.DEFAULT,
    vibrationPattern: [0, 180],
  });
}

/**
 * Request permission only when the user taps Enable.
 * Saves an Expo push token when the project is configured; local reminders
 * still work without a remote push setup.
 */
export async function registerForPushPermissions(): Promise<PermissionResult> {
  if (!nativeNotificationsAvailable()) {
    return {
      granted: false,
      status: 'unavailable',
      token: null,
      message: PERMISSION_COPY.web,
    };
  }

  await ensureAndroidChannel();

  const existing = await Notifications.getPermissionsAsync();
  let status = existing.status;
  if (status !== 'granted') {
    const requested = await Notifications.requestPermissionsAsync();
    status = requested.status;
  }

  if (status !== 'granted') {
    return {
      granted: false,
      status,
      token: null,
      message: PERMISSION_COPY.denied,
    };
  }

  let token: string | null = null;
  try {
    const projectId =
      Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId ?? undefined;
    if (projectId) {
      const result = await Notifications.getExpoPushTokenAsync({ projectId });
      token = result.data;
    }
  } catch {
    token = null;
  }

  return {
    granted: true,
    status,
    token,
    message: PERMISSION_COPY.granted,
  };
}

export async function getNotificationPermissionStatus(): Promise<PermissionResult> {
  if (!nativeNotificationsAvailable()) {
    return {
      granted: false,
      status: 'unavailable',
      token: null,
      message: PERMISSION_COPY.web,
    };
  }
  const existing = await Notifications.getPermissionsAsync();
  return {
    granted: existing.status === 'granted',
    status: existing.status,
    token: null,
    message:
      existing.status === 'granted'
        ? PERMISSION_COPY.granted
        : existing.status === 'denied'
          ? PERMISSION_COPY.denied
          : PERMISSION_COPY.intro,
  };
}

export async function cancelDailyReminder(groupId: string): Promise<void> {
  if (!nativeNotificationsAvailable()) return;
  try {
    await Notifications.cancelScheduledNotificationAsync(reminderIdentifier(groupId));
  } catch {
    // Identifier may not exist yet.
  }
}

export async function cancelAllDailyReminders(): Promise<void> {
  if (!nativeNotificationsAvailable()) return;
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  await Promise.all(
    scheduled
      .filter((n) => n.identifier.startsWith(REMINDER_ID_PREFIX))
      .map((n) => Notifications.cancelScheduledNotificationAsync(n.identifier))
  );
}

export async function scheduleDailyReminder(input: {
  groupId: string;
  groupName: string;
  copy: string;
  dailyTarget: number;
  status: DailyTargetStatus;
  muted: boolean;
}): Promise<void> {
  if (!nativeNotificationsAvailable()) return;

  const body = input.muted ? null : buildReminderBody(input);
  if (!body) {
    await cancelDailyReminder(input.groupId);
    return;
  }

  await ensureAndroidChannel();
  await cancelDailyReminder(input.groupId);

  await Notifications.scheduleNotificationAsync({
    identifier: reminderIdentifier(input.groupId),
    content: {
      title: input.groupName,
      body,
      sound: false,
      data: { groupId: input.groupId },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: REMINDER_HOUR,
      minute: REMINDER_MINUTE,
      channelId: ANDROID_CHANNEL_ID,
    },
  });
}

export async function syncDailyReminders(input: {
  optIn: boolean;
  currentUserId: string | null;
  groups: Group[];
  memberships: Membership[];
  contributions: Contribution[];
  mockSpends: MockSpend[];
}): Promise<void> {
  if (!nativeNotificationsAvailable() || !input.optIn || !input.currentUserId) {
    await cancelAllDailyReminders();
    return;
  }

  const permission = await getNotificationPermissionStatus();
  if (!permission.granted) {
    await cancelAllDailyReminders();
    return;
  }

  const mine = input.memberships.filter((m) => m.userId === input.currentUserId);
  const myGroupIds = new Set(mine.map((m) => m.groupId));
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  const stale = scheduled.filter(
    (n) =>
      n.identifier.startsWith(REMINDER_ID_PREFIX) &&
      !myGroupIds.has(n.identifier.slice(REMINDER_ID_PREFIX.length))
  );
  await Promise.all(stale.map((n) => Notifications.cancelScheduledNotificationAsync(n.identifier)));

  for (const membership of mine) {
    const group = input.groups.find((g) => g.id === membership.groupId);
    if (!group) {
      await cancelDailyReminder(membership.groupId);
      continue;
    }
    const memberCount = input.memberships.filter((m) => m.groupId === group.id).length;
    const dt = computeDailyTarget({
      goalCents: group.goalCents,
      contributions: input.contributions,
      mockSpends: input.mockSpends,
      groupId: group.id,
      tripDate: group.tripDate,
      memberCount,
    });
    await scheduleDailyReminder({
      groupId: group.id,
      groupName: group.name,
      copy: dt.copy,
      dailyTarget: dt.dailyTarget,
      status: dt.status,
      muted: Boolean(membership.muted),
    });
  }
}
