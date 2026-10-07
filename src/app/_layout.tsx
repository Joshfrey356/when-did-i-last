import * as Notifications from 'expo-notifications';
import { router, Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SystemUI from 'expo-system-ui';
import { useEffect } from 'react';
import { Platform } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ToastProvider } from '../components/Toast';
import { StoreProvider, useStore } from '../lib/store';
import { useTheme } from '../lib/theme';

/** Opens the right item when a reminder notification is tapped (cold start or while running). */
function NotificationRouter() {
  const { ready } = useStore();
  useEffect(() => {
    if (!ready || Platform.OS === 'web') return;
    const open = (resp: Notifications.NotificationResponse | null) => {
      const id = resp?.notification.request.content.data?.itemId;
      if (typeof id === 'string') router.push({ pathname: '/item/[id]', params: { id } });
    };
    Notifications.getLastNotificationResponseAsync()
      .then((r) => {
        open(r);
        if (r) Notifications.clearLastNotificationResponseAsync?.().catch(() => {});
      })
      .catch(() => {});
    const sub = Notifications.addNotificationResponseReceivedListener(open);
    return () => sub.remove();
  }, [ready]);
  return null;
}

function Shell() {
  const t = useTheme();
  useEffect(() => {
    SystemUI.setBackgroundColorAsync(t.bg).catch(() => {});
  }, [t.bg]);
  return (
    <>
      <StatusBar style={t.isDark ? 'light' : 'dark'} />
      <NotificationRouter />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: t.bg },
          animation: Platform.OS === 'ios' ? 'default' : 'fade_from_bottom',
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="welcome" options={{ gestureEnabled: false, animation: 'fade' }} />
        <Stack.Screen name="item/[id]" />
        <Stack.Screen name="edit" options={{ presentation: 'modal', contentStyle: { backgroundColor: t.sheet } }} />
        <Stack.Screen name="log" options={{ presentation: 'modal', contentStyle: { backgroundColor: t.sheet } }} />
        <Stack.Screen name="settings" />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <StoreProvider>
        <ToastProvider>
          <Shell />
        </ToastProvider>
      </StoreProvider>
    </SafeAreaProvider>
  );
}
