import { Stack } from 'expo-router';
import { colors } from '@/src/theme/colors';

export default function GroupLayout() {
  return (
    <Stack
      screenOptions={{
        headerShadowVisible: false,
        headerTintColor: colors.primary,
        headerStyle: { backgroundColor: colors.bg },
        contentStyle: { backgroundColor: colors.bg },
      }}
    >
      <Stack.Screen name="index" options={{ title: 'Group' }} />
      <Stack.Screen name="invite" options={{ title: 'Invite friends' }} />
      <Stack.Screen name="members" options={{ title: 'Members' }} />
      <Stack.Screen name="contribute" options={{ title: 'Log deposit', presentation: 'modal' }} />
      <Stack.Screen name="spend" options={{ title: 'Spend' }} />
    </Stack>
  );
}
