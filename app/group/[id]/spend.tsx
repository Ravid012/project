import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { formatUsd, parseDollarsToCents } from '@/src/math';
import { useAppStore } from '@/src/store';
import { colors } from '@/src/theme/colors';

export default function SpendScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const group = useAppStore((s) => s.groups.find((g) => g.id === id));
  const currentUserId = useAppStore((s) => s.currentUserId);
  const mockSpends = useAppStore((s) => s.mockSpends.filter((m) => m.groupId === id));
  const logMockSpend = useAppStore((s) => s.logMockSpend);
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');

  const isOwner = group?.ownerId === currentUserId;
  const spent = mockSpends.reduce((s, m) => s + m.amountCents, 0);

  const onDemoSpend = () => {
    if (!id || !isOwner) return;
    const cents = parseDollarsToCents(amount);
    if (cents == null || cents <= 0) {
      Alert.alert('Amount', 'Enter a positive amount for the demo spend.');
      return;
    }
    logMockSpend(id, cents, note || undefined);
    setAmount('');
    setNote('');
    Alert.alert('Logged', 'Mock spend recorded — card balance will drop.');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.icon}>💳</Text>
      <Text style={styles.title}>Card spend unlocks after launch</Text>
      <Text style={styles.body}>
        TripPot v1 tracks deposits only. Real shared-card transactions ship post-MVP with
        Highnote or Unit. Nothing here moves real money.
      </Text>
      <Text style={styles.meta}>Mock spends logged: {formatUsd(spent)}</Text>

      {isOwner ? (
        <View style={styles.demo}>
          <Text style={styles.demoTitle}>Demo: log mock spend (owner)</Text>
          <TextInput
            style={styles.input}
            placeholder="25.00"
            placeholderTextColor={colors.textMuted}
            keyboardType="decimal-pad"
            value={amount}
            onChangeText={setAmount}
          />
          <TextInput
            style={styles.input}
            placeholder="Note (optional)"
            placeholderTextColor={colors.textMuted}
            value={note}
            onChangeText={setNote}
          />
          <Pressable style={styles.btn} onPress={onDemoSpend}>
            <Text style={styles.btnText}>Log mock spend</Text>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, padding: 24 },
  icon: { fontSize: 40, marginBottom: 8 },
  title: { fontSize: 20, fontWeight: '800', color: colors.text },
  body: { marginTop: 10, color: colors.textSecondary, lineHeight: 20 },
  meta: { marginTop: 16, color: colors.textMuted, fontWeight: '600' },
  demo: {
    marginTop: 28,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: 'dashed',
    backgroundColor: colors.surface,
    gap: 10,
  },
  demoTitle: { fontWeight: '700', color: colors.text, marginBottom: 4 },
  input: {
    backgroundColor: colors.bg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.text,
  },
  btn: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  btnText: { color: colors.white, fontWeight: '700' },
});
