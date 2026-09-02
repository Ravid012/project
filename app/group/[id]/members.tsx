import { isSameDay, parseISO, startOfDay } from 'date-fns';
import { useLocalSearchParams } from 'expo-router';
import { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { computeDailyTarget, formatUsd } from '@/src/math';
import { useAppStore } from '@/src/store';
import { colors } from '@/src/theme/colors';

export default function MembersScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const groups = useAppStore((s) => s.groups);
  const allMemberships = useAppStore((s) => s.memberships);
  const users = useAppStore((s) => s.users);
  const group = useMemo(() => groups.find((g) => g.id === id), [groups, id]);
  const memberships = useMemo(
    () => allMemberships.filter((m) => m.groupId === id),
    [allMemberships, id]
  );
  const contributions = useAppStore((s) => s.contributions);
  const mockSpends = useAppStore((s) => s.mockSpends);
  const addDemoMember = useAppStore((s) => s.addDemoMember);
  const toggleMute = useAppStore((s) => s.toggleMute);
  const currentUserId = useAppStore((s) => s.currentUserId);

  if (!group) {
    return (
      <View style={styles.miss}>
        <Text>Group not found</Text>
      </View>
    );
  }

  const dt = computeDailyTarget({
    goalCents: group.goalCents,
    contributions,
    mockSpends,
    groupId: group.id,
    tripDate: group.tripDate,
    memberCount: memberships.length,
  });


  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 20, gap: 10 }}>
      <Text style={styles.lead}>
        Daily target {formatUsd(dt.dailyTarget)} each · {memberships.length} members
      </Text>

      {memberships.map((m) => {
        const u = users.find((x) => x.id === m.userId);
        const mine = contributions.filter((c) => c.groupId === id && c.userId === m.userId);
        const paid = mine.reduce((s, c) => s + c.amountCents, 0);
        const today = startOfDay(new Date());
        const todayPaid = mine
          .filter((c) => isSameDay(parseISO(c.createdAt), today))
          .reduce((s, c) => s + c.amountCents, 0);
        const finalStatus =
          dt.status === 'goal_reached' || todayPaid >= dt.dailyTarget || dt.dailyTarget === 0
            ? 'caught_up'
            : 'behind';

        return (
          <View key={m.id} style={styles.row}>
            <View style={{ flex: 1 }}>
              <Text style={styles.name}>
                {u?.displayName ?? 'Member'}
                {m.userId === currentUserId ? ' (you)' : ''}
                {m.role === 'owner' ? ' · Owner' : ''}
              </Text>
              <Text style={styles.sub}>
                Total {formatUsd(paid)} · today {formatUsd(todayPaid)}
                {dt.dailyTarget > 0 ? ` / ${formatUsd(dt.dailyTarget)}` : ''}
              </Text>
            </View>
            <View
              style={[
                styles.badge,
                finalStatus === 'caught_up' ? styles.badgeOk : styles.badgeBehind,
              ]}
            >
              <Text
                style={[
                  styles.badgeText,
                  { color: finalStatus === 'caught_up' ? colors.success : colors.warning },
                ]}
              >
                {finalStatus === 'caught_up' ? 'Caught up' : 'Behind'}
              </Text>
            </View>
          </View>
        );
      })}

      <Pressable style={styles.demo} onPress={() => id && addDemoMember(id)}>
        <Text style={styles.demoText}>Add demo friend (Alex)</Text>
      </Pressable>
      <Pressable
        style={styles.demo}
        onPress={() => id && toggleMute(id)}
      >
        <Text style={styles.demoText}>
          {memberships.find((m) => m.userId === currentUserId)?.muted
            ? 'Unmute this group (stub)'
            : 'Mute this group (stub)'}
        </Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  miss: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  lead: { color: colors.textSecondary, marginBottom: 8 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 10,
  },
  name: { fontSize: 16, fontWeight: '700', color: colors.text },
  sub: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
  badge: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999 },
  badgeOk: { backgroundColor: colors.successSoft },
  badgeBehind: { backgroundColor: colors.warningSoft },
  badgeText: { fontSize: 12, fontWeight: '700' },
  demo: {
    marginTop: 12,
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: 'dashed',
  },
  demoText: { color: colors.primary, fontWeight: '600' },
});
