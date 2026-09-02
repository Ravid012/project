import * as Clipboard from 'expo-clipboard';
import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Pressable, Share, StyleSheet, Text, View } from 'react-native';

import { useAppStore } from '@/src/store';
import { colors } from '@/src/theme/colors';

export default function InviteScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const ensureInvite = useAppStore((s) => s.ensureInvite);
  const group = useAppStore((s) => s.groups.find((g) => g.id === id));
  const [copied, setCopied] = useState(false);
  const [inviteCode, setInviteCode] = useState<string | null>(null);
  const invites = useAppStore((s) => s.invites);

  useEffect(() => {
    if (!id) return;
    const inv = ensureInvite(id);
    setInviteCode(inv.code);
  }, [id, ensureInvite]);

  const invite = invites.find((i) => i.groupId === id && i.code === inviteCode) ??
    invites.find((i) => i.groupId === id) ?? null;

  if (!group || !invite) {
    return (
      <View style={styles.miss}>
        <Text>Group not found</Text>
      </View>
    );
  }

  const shareMessage = `Join my TripPot "${group.name}"! Code: ${invite.code}\nOr open tripsavings://join/${invite.code}`;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Invite friends</Text>
      <Text style={styles.body}>Share this code so friends can join and split the daily save target.</Text>

      <View style={styles.codeBox}>
        <Text style={styles.code}>{invite.code}</Text>
      </View>

      <Pressable
        style={styles.btn}
        onPress={async () => {
          await Clipboard.setStringAsync(invite.code);
          setCopied(true);
          Alert.alert('Copied', invite.code);
        }}
      >
        <Text style={styles.btnText}>{copied ? 'Copied!' : 'Copy code'}</Text>
      </Pressable>

      <Pressable
        style={styles.secondary}
        onPress={async () => {
          try {
            await Share.share({ message: shareMessage });
          } catch {
            // ignore
          }
        }}
      >
        <Text style={styles.secondaryText}>Share invite</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, padding: 24 },
  miss: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 24, fontWeight: '800', color: colors.text },
  body: { marginTop: 8, color: colors.textSecondary, lineHeight: 20, marginBottom: 24 },
  codeBox: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 16,
  },
  code: { fontSize: 32, fontWeight: '800', letterSpacing: 4, color: colors.primary },
  btn: {
    backgroundColor: colors.primary,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 10,
  },
  btnText: { color: colors.white, fontWeight: '700', fontSize: 16 },
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
