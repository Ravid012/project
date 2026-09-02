import { StyleSheet, Text, View } from 'react-native';

import { colors } from '@/src/theme/colors';

/** Top-level Spend tab stub — group-level mock spend lives under group/[id]/spend. */
export default function SpendTabScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.icon}>💳</Text>
      <Text style={styles.title}>Card spend unlocks after launch</Text>
      <Text style={styles.body}>
        TripPot v1 tracks deposits only. Real shared-card transactions ship post-MVP. Optional
        owner demo mock spends are available inside a group. Nothing here moves real money.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, padding: 24 },
  icon: { fontSize: 40, marginBottom: 8 },
  title: { fontSize: 20, fontWeight: '800', color: colors.text },
  body: { marginTop: 10, color: colors.textSecondary, lineHeight: 20 },
});
