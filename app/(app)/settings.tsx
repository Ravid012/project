import { useRouter } from 'expo-router';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import { useAppStore } from '@/src/store';
import { colors } from '@/src/theme/colors';

export default function SettingsScreen() {
  const router = useRouter();
  const currentUserId = useAppStore((s) => s.currentUserId);
  const users = useAppStore((s) => s.users);
  const user = users.find((u) => u.id === currentUserId) ?? null;
  const signOut = useAppStore((s) => s.signOut);
  const deleteAccount = useAppStore((s) => s.deleteAccount);

  const onDelete = () => {
    Alert.alert(
      'Delete account?',
      'This permanently removes your local TripPot data and owned groups. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            deleteAccount();
            router.replace('/(auth)/welcome');
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.label}>Signed in as</Text>
        <Text style={styles.name}>{user?.displayName ?? '—'}</Text>
        <Text style={styles.email}>{user?.email ?? ''}</Text>
      </View>

      <Pressable
        style={styles.row}
        onPress={() => {
          signOut();
          router.replace('/(auth)/welcome');
        }}
      >
        <Text style={styles.rowText}>Sign out</Text>
      </Pressable>

      <Pressable style={[styles.row, styles.dangerRow]} onPress={onDelete}>
        <Text style={[styles.rowText, styles.dangerText]}>Delete account</Text>
      </Pressable>

      <Text style={styles.footer}>
        Notifications & push are stubbed in MVP. Mock card balance only — real card issuing
        (Highnote/Unit) comes post-MVP.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, padding: 20 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 16,
  },
  label: { fontSize: 12, color: colors.textMuted, fontWeight: '600', textTransform: 'uppercase' },
  name: { fontSize: 22, fontWeight: '800', color: colors.text, marginTop: 6 },
  email: { fontSize: 14, color: colors.textSecondary, marginTop: 4 },
  row: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 10,
  },
  rowText: { fontSize: 16, fontWeight: '600', color: colors.text },
  dangerRow: { borderColor: colors.dangerSoft, backgroundColor: colors.dangerSoft },
  dangerText: { color: colors.danger },
  footer: { marginTop: 24, fontSize: 12, color: colors.textMuted, lineHeight: 18 },
});
