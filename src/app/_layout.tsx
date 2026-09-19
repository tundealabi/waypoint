import { DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router';
import { Stack } from 'expo-router/stack';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { useColorScheme } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { useOnline } from '@/hooks';
import { hydrate, setOnline, useWaypoint } from '@/store';

SplashScreen.preventAutoHideAsync();
hydrate();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const online = useOnline();
  const { session } = useWaypoint();

  useEffect(() => {
    setOnline(online);
  }, [online]);

  useEffect(() => {
    void SplashScreen.hideAsync();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Protected guard={Boolean(session)}>
            <Stack.Screen name="(app)" />
          </Stack.Protected>
          <Stack.Protected guard={!session}>
            <Stack.Screen name="(auth)" />
          </Stack.Protected>
          <Stack.Screen
            name="join/[tripId]"
            options={{ headerShown: true, title: 'Join trip', presentation: 'modal' }}
          />
        </Stack>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
