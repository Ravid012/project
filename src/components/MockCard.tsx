import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { formatUsd } from '@/src/math';
import { colors } from '@/src/theme/colors';

/** Generic mock card UI. Post-MVP swap-in: Highnote or Unit. */
export function MockCard({
  balanceCents,
  groupName,
}: {
  balanceCents: number;
  groupName: string;
}) {
  return (
    <View style={styles.wrap}>
      <View style={styles.card}>
        <View style={styles.row}>
          <Text style={styles.brand}>TripPot Card</Text>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>Preview — real card coming</Text>
          </View>
        </View>
        <Text style={styles.label}>Card balance</Text>
        <Text style={styles.balance}>{formatUsd(balanceCents)}</Text>
        <Text style={styles.footer}>
          {groupName} · display only · not a real debit card
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginTop: 4 },
  card: {
    borderRadius: 18,
    padding: 18,
    backgroundColor: colors.cardGradientStart,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 18,
    gap: 8,
    flexWrap: 'wrap',
  },
  brand: {
    color: colors.white,
    fontWeight: '700',
    fontSize: 15,
    letterSpacing: 0.3,
  },
  badge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  badgeText: { color: colors.white, fontSize: 11, fontWeight: '700' },
  label: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 13,
  },
  balance: {
    color: colors.white,
    fontSize: 32,
    fontWeight: '800',
    marginTop: 4,
    letterSpacing: -0.5,
  },
  footer: {
    marginTop: 16,
    color: 'rgba(255,255,255,0.55)',
    fontSize: 12,
  },
});
