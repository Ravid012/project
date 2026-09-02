import { useFonts } from 'expo-font';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import 'react-native-reanimated';

import { useAppStore } from '@/src/store';
import { colors } from '@/src/theme/colors';

export { ErrorBoundary } from 'expo-router';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });
  const hydrated = useAppStore((s) => s.hydrated);
  const currentUserId = useAppStore((s) => s.currentUserId);
  const setHydrated = useAppStore((s) => s.setHydrated);
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    const unsub = useAppStore.persist.onFinishHydration(() => setHydrated(true));
    if (useAppStore.persist.hasHydrated()) setHydrated(true);
    const t = setTimeout(() => setHydrated(true), 800);
    return () => {
      unsub();
      clearTimeout(t);
    };
  }, [setHydrated]);

  useEffect(() => {
    if (loaded && hydrated) SplashScreen.hideAsync();
  }, [loaded, hydrated]);

  useEffect(() => {
    if (!hydrated || !loaded) return;
    const root = segments[0];
    const inAuth = root === '(auth)';
    const inJoin = root === 'join';
    if (!currentUserId && !inAuth && !inJoin) {
      router.replace('/(auth)/welcome');
    } else if (currentUserId && inAuth) {
      router.replace('/(app)');
    }
  }, [currentUserId, hydrated, loaded, segments, router]);

  if (!loaded || !hydrated) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg }}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  return (
    <>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerShadowVisible: false,
          headerTintColor: colors.primary,
          headerStyle: { backgroundColor: colors.bg },
          contentStyle: { backgroundColor: colors.bg },
        }}
      >
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(app)" options={{ headerShown: false }} />
        <Stack.Screen name="group/create" options={{ title: 'New trip pot', presentation: 'modal' }} />
        <Stack.Screen name="group/[id]" options={{ headerShown: false }} />
        <Stack.Screen name="join" options={{ headerShown: false, presentation: 'modal' }} />
        <Stack.Screen name="+not-found" />
      </Stack>
    </>
  );
}
