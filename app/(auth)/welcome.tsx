import { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAppStore } from '@/src/store';
import { colors } from '@/src/theme/colors';

export default function WelcomeScreen() {
  const signInWithEmail = useAppStore((s) => s.signInWithEmail);
  const signInWithAppleStub = useAppStore((s) => s.signInWithAppleStub);
  const [email, setEmail] = useState('demo@trippot.app');
  const [password, setPassword] = useState('demo');
  const [name, setName] = useState('');

  const onEmail = () => {
    const res = signInWithEmail(email, password, name || undefined);
    if (!res.ok) Alert.alert('Sign in', res.error);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.wrap}
      >
        <View style={styles.hero}>
          <Text style={styles.emoji}>🧳</Text>
          <Text style={styles.title}>TripPot</Text>
          <Text style={styles.subtitle}>
            Lock in a trip goal with friends. Deposit a little every day until you leave.
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>Display name (new accounts)</Text>
          <TextInput
            style={styles.input}
            placeholder="Jordan"
            placeholderTextColor={colors.textMuted}
            value={name}
            onChangeText={setName}
            autoCapitalize="words"
          />
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            placeholder="you@email.com"
            placeholderTextColor={colors.textMuted}
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
          />
          <Text style={styles.label}>Password (demo)</Text>
          <TextInput
            style={styles.input}
            placeholder="••••"
            placeholderTextColor={colors.textMuted}
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />
          <Pressable style={styles.primaryBtn} onPress={onEmail}>
            <Text style={styles.primaryBtnText}>Continue with email</Text>
          </Pressable>

          <View style={styles.dividerRow}>
            <View style={styles.divider} />
            <Text style={styles.dividerText}>or</Text>
            <View style={styles.divider} />
          </View>

          <Pressable
            style={styles.appleBtn}
            onPress={() => {
              // TODO: real Apple Sign-In (App Store requirement)
              signInWithAppleStub();
            }}
          >
            <Text style={styles.appleBtnText}> Continue with Apple</Text>
          </Pressable>
          <Text style={styles.hint}>Apple Sign-In is stubbed for local demo. Wire expo-apple-authentication before TestFlight.</Text>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  wrap: { flex: 1, padding: 24, justifyContent: 'center' },
  hero: { marginBottom: 28 },
  emoji: { fontSize: 48, marginBottom: 8 },
  title: { fontSize: 36, fontWeight: '800', color: colors.text, letterSpacing: -0.5 },
  subtitle: { marginTop: 8, fontSize: 16, lineHeight: 22, color: colors.textSecondary },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  label: { fontSize: 13, fontWeight: '600', color: colors.textSecondary, marginBottom: 6, marginTop: 10 },
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
  primaryBtn: {
    marginTop: 18,
    backgroundColor: colors.primary,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  primaryBtnText: { color: colors.white, fontWeight: '700', fontSize: 16 },
  dividerRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 16, gap: 8 },
  divider: { flex: 1, height: 1, backgroundColor: colors.border },
  dividerText: { color: colors.textMuted, fontSize: 13 },
  appleBtn: {
    backgroundColor: colors.black,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  appleBtnText: { color: colors.white, fontWeight: '700', fontSize: 16 },
  hint: { marginTop: 12, fontSize: 12, color: colors.textMuted, lineHeight: 16 },
});
