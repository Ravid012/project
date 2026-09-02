import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { useAppStore } from '@/src/store';
import { colors } from '@/src/theme/colors';

/** Deep link landing: tripsavings://join/CODE */
export default function JoinDeepLinkScreen() {
  const { code } = useLocalSearchParams<{ code: string }>();
  const router = useRouter();
  const joinWithCode = useAppStore((s) => s.joinWithCode);
  const currentUserId = useAppStore((s) => s.currentUserId);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(true);

  useEffect(() => {
    if (!currentUserId) {
      // Auth gate may also redirect; keep code via manual join
      router.replace({ pathname: '/(auth)/welcome' });
      return;
    }
    if (!code) {
      setError('Missing invite code');
      setBusy(false);
      return;
    }
    const res = joinWithCode(String(code));
    setBusy(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    router.replace(`/group/${res.groupId}`);
  }, [code, currentUserId, joinWithCode, router]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Joining trip…</Text>
      {busy && <ActivityIndicator color={colors.primary} />}
      {error && (
        <>
          <Text style={styles.error}>{error}</Text>
          <Pressable style={styles.btn} onPress={() => router.replace('/join')}>
            <Text style={styles.btnText}>Enter code manually</Text>
          </Pressable>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, padding: 24, justifyContent: 'center' },
  title: { fontSize: 22, fontWeight: '800', color: colors.text, marginBottom: 16 },
  error: { color: colors.danger, marginVertical: 12 },
  btn: {
    marginTop: 12,
    backgroundColor: colors.primary,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  btnText: { color: colors.white, fontWeight: '700' },
});
