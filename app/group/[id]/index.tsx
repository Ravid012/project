import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { MockCard } from '@/src/components/MockCard';
import { computeDailyTarget, formatUsd, formatUsdWhole } from '@/src/math';
import { useAppStore } from '@/src/store';
import { colors } from '@/src/theme/colors';

export default function GroupHomeScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const groups = useAppStore((s) => s.groups);
  const allMemberships = useAppStore((s) => s.memberships);
  const users = useAppStore((s) => s.users);
  const contributions = useAppStore((s) => s.contributions);
  const mockSpends = useAppStore((s) => s.mockSpends);
  const currentUserId = useAppStore((s) => s.currentUserId);
  const deleteGroup = useAppStore((s) => s.deleteGroup);
  const leaveGroup = useAppStore((s) => s.leaveGroup);

  const group = useMemo(() => groups.find((g) => g.id === id), [groups, id]);
  const memberships = useMemo(
    () => allMemberships.filter((m) => m.groupId === id),
    [allMemberships, id]
  );

  if (!group) {
    return (
      <View style={styles.miss}>
        <Text style={styles.missText}>Group not found</Text>
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

  const cardBalance = Math.max(0, dt.pot);
  const statusColor =
    dt.status === 'goal_reached'
      ? colors.success
      : dt.status === 'past_due'
        ? colors.warning
        : colors.primary;

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 20, paddingBottom: 48 }}>
      <View style={styles.header}>
        <Text style={styles.emoji}>{group.emoji || '✈️'}</Text>
        <Text style={styles.title}>{group.name}</Text>
        <Text style={styles.meta}>
          Goal {formatUsd(group.goalCents)} · Trip {group.tripDate}
        </Text>
      </View>

      <View style={styles.statRow}>
        <View style={styles.stat}>
          <Text style={styles.statLabel}>Days left</Text>
          <Text style={styles.statValue}>{Math.max(0, dt.daysLeft)}</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statLabel}>Pot</Text>
          <Text style={styles.statValue}>{formatUsd(Math.max(0, dt.pot))}</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statLabel}>Funded</Text>
          <Text style={styles.statValue}>{dt.percentFunded}%</Text>
        </View>
      </View>

      <View style={[styles.dailyBanner, { backgroundColor: statusColor + '18', borderColor: statusColor + '44' }]}>
        <Text style={[styles.dailyCopy, { color: statusColor }]}>{dt.copy}</Text>
      </View>

      <Text style={styles.section}>Members</Text>
      <View style={styles.chips}>
        {memberships.map((m) => {
          const u = users.find((x) => x.id === m.userId);
          return (
            <View key={m.id} style={styles.chip}>
              <Text style={styles.chipText}>
                {u?.displayName?.split(' ')[0] ?? 'Member'}
                {m.role === 'owner' ? ' ★' : ''}
              </Text>
            </View>
          );
        })}
        <Pressable style={[styles.chip, styles.chipAction]} onPress={() => router.push(`/group/${id}/members`)}>
          <Text style={[styles.chipText, { color: colors.primary }]}>See all</Text>
        </Pressable>
      </View>

      <MockCard balanceCents={cardBalance} groupName={group.name} />


      <View style={styles.actions}>
        <Pressable style={styles.primary} onPress={() => router.push(`/group/${id}/contribute`)}>
          <Text style={styles.primaryText}>
            {dt.dailyTarget > 0
              ? dt.status === 'past_due'
                ? `Catch up — deposit ${formatUsdWhole(dt.dailyTarget)}`
                : `Deposit ${formatUsdWhole(dt.dailyTarget)} today`
              : 'Log deposit'}
          </Text>
        </Pressable>
        <Pressable style={styles.secondary} onPress={() => router.push(`/group/${id}/invite`)}>
          <Text style={styles.secondaryText}>Invite</Text>
        </Pressable>
        <Pressable style={styles.secondary} onPress={() => router.push(`/group/${id}/spend`)}>
          <Text style={styles.secondaryText}>Spend</Text>
        </Pressable>
        {group.ownerId === currentUserId ? (
          <Pressable
            style={styles.secondary}
            onPress={() => {
              Alert.alert('Delete group?', 'Only allowed when no other members remain.', [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Delete',
                  style: 'destructive',
                  onPress: () => {
                    const res = deleteGroup(group.id);
                    if (!res.ok) {
                      Alert.alert('Cannot delete', res.error);
                      return;
                    }
                    router.replace('/(app)');
                  },
                },
              ]);
            }}
          >
            <Text style={[styles.secondaryText, { color: colors.danger }]}>Delete empty group</Text>
          </Pressable>
        ) : (
          <Pressable
            style={styles.secondary}
            onPress={() => {
              const res = leaveGroup(group.id);
              if (!res.ok) {
                Alert.alert('Cannot leave', res.error);
                return;
              }
              router.replace('/(app)');
            }}
          >
            <Text style={styles.secondaryText}>Leave group</Text>
          </Pressable>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  miss: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  missText: { color: colors.textSecondary },
  header: { alignItems: 'center', marginBottom: 16 },
  emoji: { fontSize: 48 },
  title: { fontSize: 26, fontWeight: '800', color: colors.text, marginTop: 6 },
  meta: { fontSize: 13, color: colors.textSecondary, marginTop: 4 },
  statRow: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  stat: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  statLabel: { fontSize: 11, color: colors.textMuted, fontWeight: '600', textTransform: 'uppercase' },
  statValue: { fontSize: 18, fontWeight: '800', color: colors.text, marginTop: 4 },
  dailyBanner: {
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    marginBottom: 18,
  },
  dailyCopy: { fontSize: 17, fontWeight: '700', textAlign: 'center' },
  section: { fontSize: 14, fontWeight: '700', color: colors.textSecondary, marginBottom: 8 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 18 },
  chip: {
    backgroundColor: colors.surface,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipAction: { borderColor: colors.primarySoft, backgroundColor: colors.primarySoft },
  chipText: { fontSize: 13, fontWeight: '600', color: colors.text },
  actions: { gap: 10, marginTop: 18 },
  primary: {
    backgroundColor: colors.primary,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  primaryText: { color: colors.white, fontWeight: '700', fontSize: 16 },
  secondary: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  secondaryText: { color: colors.text, fontWeight: '700', fontSize: 16 },
});
