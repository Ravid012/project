import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { useAppStore } from '@/src/store';
import { colors } from '@/src/theme/colors';

export default function JoinScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ code?: string }>();
  const joinWithCode = useAppStore((s) => s.joinWithCode);
  const [code, setCode] = useState(typeof params.code === 'string' ? params.code : '');

  useEffect(() => {
    if (typeof params.code === 'string' && params.code.trim()) {
      setCode(params.code.trim().toUpperCase());
    }
  }, [params.code]);

  const onJoin = () => {
    const res = joinWithCode(code);
    if (!res.ok) {
      Alert.alert('Join failed', res.error);
      return;
    }
    router.replace(`/group/${res.groupId}`);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Join a trip pot</Text>
      <Text style={styles.body}>Enter the invite code from a friend.</Text>
      <TextInput
        style={styles.input}
        placeholder="ABC123"
        placeholderTextColor={colors.textMuted}
        autoCapitalize="characters"
        value={code}
        onChangeText={setCode}
      />
      <Pressable style={styles.btn} onPress={onJoin}>
        <Text style={styles.btnText}>Join</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, padding: 24 },
  title: { fontSize: 24, fontWeight: '800', color: colors.text },
  body: { marginTop: 8, color: colors.textSecondary, marginBottom: 20 },
  input: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: 2,
    color: colors.text,
    textAlign: 'center',
  },
  btn: {
    marginTop: 20,
    backgroundColor: colors.primary,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  btnText: { color: colors.white, fontWeight: '700', fontSize: 16 },
});
