import { Stack } from 'expo-router';
import { colors } from '@/src/theme/colors';

export default function JoinLayout() {
  return (
    <Stack
      screenOptions={{
        headerShadowVisible: false,
        headerTintColor: colors.primary,
        headerStyle: { backgroundColor: colors.bg },
        contentStyle: { backgroundColor: colors.bg },
      }}
    >
      <Stack.Screen name="index" options={{ title: 'Join a pot' }} />
      <Stack.Screen name="[code]" options={{ title: 'Join invite' }} />
    </Stack>
  );
}
