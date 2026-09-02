import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { parseDollarsToCents } from '@/src/math';
import { useAppStore } from '@/src/store';
import { colors } from '@/src/theme/colors';

export default function ContributeScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const logContribution = useAppStore((s) => s.logContribution);
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');

  const onSave = () => {
    if (!id) return;
    const cents = parseDollarsToCents(amount);
    if (cents == null || cents <= 0) {
      Alert.alert('Amount', 'Enter a positive dollar amount.');
      return;
    }
    try {
      logContribution(id, cents, note || undefined);
      Alert.alert('Logged', 'Contribution added to the pot (honor system — no ACH yet).');
      router.back();
    } catch (e) {
      Alert.alert('Could not save', e instanceof Error ? e.message : 'Unknown error');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Log deposit</Text>
      <Text style={styles.hint}>
        Manual “I deposited” for v1. Real funding comes with Highnote/Unit post-MVP.
      </Text>

      <Text style={styles.label}>Amount (USD)</Text>
      <TextInput
        style={styles.input}
        placeholder="50.00"
        placeholderTextColor={colors.textMuted}
        keyboardType="decimal-pad"
        value={amount}
        onChangeText={setAmount}
      />

      <Text style={styles.label}>Note (optional)</Text>
      <TextInput
        style={styles.input}
        placeholder="Venmo to Alex"
        placeholderTextColor={colors.textMuted}
        value={note}
        onChangeText={setNote}
      />

      <Pressable style={styles.btn} onPress={onSave}>
        <Text style={styles.btnText}>Save contribution</Text>
      </Pressable>
      <Pressable style={styles.ghost} onPress={() => router.back()}>
        <Text style={styles.ghostText}>Cancel</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, padding: 20 },
  title: { fontSize: 24, fontWeight: '800', color: colors.text },
  hint: { marginTop: 8, marginBottom: 16, color: colors.textSecondary, lineHeight: 20 },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 6,
    marginTop: 10,
  },
  input: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.text,
  },
  btn: {
    marginTop: 24,
    backgroundColor: colors.primary,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  btnText: { color: colors.white, fontWeight: '700', fontSize: 16 },
  ghost: {
    marginTop: 10,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  ghostText: { color: colors.text, fontWeight: '700', fontSize: 16 },
});
