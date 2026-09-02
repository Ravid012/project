import { Tabs } from 'expo-router';
import { Text } from 'react-native';

import { colors } from '@/src/theme/colors';

function TabIcon({ label, focused }: { label: string; focused: boolean }) {
  const map: Record<string, string> = { Home: '🏠', Spend: '💳', Settings: '⚙️' };
  return (
    <Text style={{ fontSize: 20, opacity: focused ? 1 : 0.55 }}>{map[label] ?? '•'}</Text>
  );
}

export default function AppTabsLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        headerStyle: { backgroundColor: colors.bg },
        headerTitleStyle: { fontWeight: '700', color: colors.text },
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ focused }) => <TabIcon label="Home" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="spend"
        options={{
          title: 'Spend',
          tabBarIcon: ({ focused }) => <TabIcon label="Spend" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ focused }) => <TabIcon label="Settings" focused={focused} />,
        }}
      />
    </Tabs>
  );
}
