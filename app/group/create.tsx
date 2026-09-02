import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { parseDollarsToCents } from '@/src/math';
import { useAppStore } from '@/src/store';
import { colors } from '@/src/theme/colors';

const EMOJIS = ['✈️', '🏖️', '🎿', '🏕️', '🗽', '🌴', '🏔️', '🎢'];

export default function CreateGroupScreen() {
  const router = useRouter();
  const createGroup = useAppStore((s) => s.createGroup);
  const [name, setName] = useState('');
  const [emoji, setEmoji] = useState('✈️');
  const [goal, setGoal] = useState('2000');
  const [tripDate, setTripDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 60);
    return d.toISOString().slice(0, 10);
  });

  const onCreate = () => {
    if (!name.trim()) {
      Alert.alert('Name required', 'Give your trip pot a name.');
      return;
    }
    const cents = parseDollarsToCents(goal);
    if (cents == null || cents < 100) {
      Alert.alert('Goal', 'Enter a goal of at least $1.');
      return;
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(tripDate)) {
      Alert.alert('Trip date', 'Use YYYY-MM-DD format.');
      return;
    }
    const trip = new Date(`${tripDate}T23:59:59`);
    if (trip.getTime() <= Date.now()) {
      Alert.alert('Date', 'Trip date must be in the future.');
      return;
    }
    const { group } = createGroup({
      name: name.trim(),
      emoji,
      goalCents: cents,
      tripDate,
    });
    router.replace(`/group/${group.id}/invite`);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
      <Text style={styles.label}>Trip name</Text>
      <TextInput
        style={styles.input}
        placeholder="Bali 2027"
        placeholderTextColor={colors.textMuted}
        value={name}
        onChangeText={setName}
      />

      <Text style={styles.label}>Cover emoji</Text>
      <View style={styles.emojiRow}>
        {EMOJIS.map((e) => (
          <Pressable
            key={e}
            onPress={() => setEmoji(e)}
            style={[styles.emojiChip, emoji === e && styles.emojiChipOn]}
          >
            <Text style={{ fontSize: 22 }}>{e}</Text>
          </Pressable>
        ))}
      </View>

      <Text style={styles.label}>Goal (USD)</Text>
      <TextInput
        style={styles.input}
        placeholder="2000"
        placeholderTextColor={colors.textMuted}
        keyboardType="decimal-pad"
        value={goal}
        onChangeText={setGoal}
      />

      <Text style={styles.label}>Trip date (YYYY-MM-DD)</Text>
      <TextInput
        style={styles.input}
        placeholder="2027-06-15"
        placeholderTextColor={colors.textMuted}
        autoCapitalize="none"
        value={tripDate}
        onChangeText={setTripDate}
      />

      <Text style={styles.hint}>
        Daily $X = ceil(remaining ÷ days left ÷ members). You’ll invite friends next.
      </Text>

      <Pressable style={styles.btn} onPress={onCreate}>
        <Text style={styles.btnText}>Create & invite</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  label: { fontSize: 13, fontWeight: '600', color: colors.textSecondary, marginBottom: 6, marginTop: 14 },
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
  emojiRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  emojiChip: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  emojiChipOn: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
  hint: { marginTop: 14, fontSize: 13, color: colors.textMuted, lineHeight: 18 },
  btn: {
    marginTop: 28,
    backgroundColor: colors.primary,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  btnText: { color: colors.white, fontWeight: '700', fontSize: 16 },
});
