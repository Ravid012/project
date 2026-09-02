import { useRouter } from 'expo-router';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

import { computeDailyTarget, formatUsd } from '@/src/math';
import { useAppStore } from '@/src/store';
import { colors } from '@/src/theme/colors';

export default function HomeScreen() {
  const router = useRouter();
  const currentUserId = useAppStore((s) => s.currentUserId);
  const users = useAppStore((s) => s.users);
  const user = users.find((u) => u.id === currentUserId) ?? null;
  const groups = useAppStore((s) => s.groups);
  const memberships = useAppStore((s) => s.memberships);
  const contributions = useAppStore((s) => s.contributions);
  const mockSpends = useAppStore((s) => s.mockSpends);


  const myGroupIds = new Set(
    memberships.filter((m) => m.userId === currentUserId).map((m) => m.groupId)
  );
  const myGroups = groups.filter((g) => myGroupIds.has(g.id));

  return (
    <View style={styles.container}>
      <Text style={styles.greeting}>Hey {user?.displayName?.split(' ')[0] ?? 'there'} 👋</Text>
      <Text style={styles.lead}>Your trip pots</Text>

      <FlatList
        data={myGroups}
        keyExtractor={(g) => g.id}
        contentContainerStyle={{ paddingBottom: 120, gap: 12 }}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>✈️</Text>
            <Text style={styles.emptyTitle}>No pots yet</Text>
            <Text style={styles.emptyBody}>
              Create a trip goal, invite friends, and get a daily deposit target.
            </Text>
            <Pressable style={styles.emptyBtn} onPress={() => router.push('/group/create')}>
              <Text style={styles.emptyBtnText}>Create your first pot</Text>
            </Pressable>
            <Pressable onPress={() => router.push('/join')} style={{ marginTop: 12 }}>
              <Text style={styles.link}>Have an invite code? Join</Text>
            </Pressable>
          </View>
        }
        renderItem={({ item }) => {
          const memberCount = memberships.filter((m) => m.groupId === item.id).length;
          const dt = computeDailyTarget({
            goalCents: item.goalCents,
            contributions,
            mockSpends,
            groupId: item.id,
            tripDate: item.tripDate,
            memberCount,
          });
          return (
            <Pressable
              style={styles.card}
              onPress={() => router.push(`/group/${item.id}`)}
            >
              <View style={styles.cardTop}>
                <Text style={styles.cardEmoji}>{item.emoji || '✈️'}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardTitle}>{item.name}</Text>
                  <Text style={styles.cardMeta}>
                    {dt.daysLeft > 0 ? `${dt.daysLeft} days left` : 'Trip date passed'} ·{' '}
                    {dt.percentFunded}% funded
                  </Text>
                </View>
                <Text style={styles.cardPot}>{formatUsd(Math.max(0, dt.pot))}</Text>
              </View>
              <View style={styles.pill}>
                <Text style={styles.pillText}>{dt.copy}</Text>
              </View>
            </Pressable>
          );
        }}
      />

      <Pressable style={styles.fab} onPress={() => router.push('/group/create')}>
        <Text style={styles.fabText}>＋</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, paddingHorizontal: 20, paddingTop: 8 },
  greeting: { fontSize: 15, color: colors.textSecondary, marginBottom: 4 },
  lead: { fontSize: 28, fontWeight: '800', color: colors.text, marginBottom: 16 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  cardEmoji: { fontSize: 32 },
  cardTitle: { fontSize: 18, fontWeight: '700', color: colors.text },
  cardMeta: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
  cardPot: { fontSize: 16, fontWeight: '800', color: colors.primary },
  pill: {
    marginTop: 12,
    alignSelf: 'flex-start',
    backgroundColor: colors.primarySoft,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  pillText: { color: colors.primaryDark, fontWeight: '600', fontSize: 13 },
  fab: {
    position: 'absolute',
    right: 24,
    bottom: 24,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.fab,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  fabText: { color: colors.white, fontSize: 32, marginTop: -2 },
  empty: {
    marginTop: 40,
    alignItems: 'center',
    padding: 24,
    backgroundColor: colors.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  emptyEmoji: { fontSize: 40, marginBottom: 8 },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: colors.text },
  emptyBody: { textAlign: 'center', color: colors.textSecondary, marginTop: 8, lineHeight: 20 },
  emptyBtn: {
    marginTop: 18,
    backgroundColor: colors.primary,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 12,
  },
  emptyBtnText: { color: colors.white, fontWeight: '700' },
  link: { color: colors.primary, fontWeight: '600' },
});
