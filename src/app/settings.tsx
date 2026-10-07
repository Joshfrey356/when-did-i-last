import Ionicons from '@expo/vector-icons/Ionicons';
import Constants from 'expo-constants';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, Linking, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useToast } from '../components/Toast';
import { IconButton, SectionLabel, Toggle, type IconName } from '../components/ui';
import { exportBackup, pickBackup } from '../lib/backup';
import { ensurePermission, permissionStatus, sendTestNotification } from '../lib/reminders';
import { useStore } from '../lib/store';
import { display, radius, useTheme } from '../lib/theme';
import { formatHour } from '../lib/time';

const HOURS = [6, 7, 8, 9, 10, 12, 17, 19, 20];

function confirm(title: string, msg: string, ok: string, onOk: () => void) {
  if (Platform.OS === 'web') {
    if (window.confirm(`${title}\n\n${msg}`)) onOk();
    return;
  }
  Alert.alert(title, msg, [
    { text: 'Cancel', style: 'cancel' },
    { text: ok, style: 'destructive', onPress: onOk },
  ]);
}

export default function Settings() {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const { settings, updateSettings, items, exportData, replaceAll, resetAll, haptic } = useStore();
  const toast = useToast();
  const [perm, setPerm] = useState<'granted' | 'denied' | 'undetermined'>('undetermined');

  useEffect(() => {
    permissionStatus().then(setPerm);
  }, []);

  const toggleReminders = async (on: boolean) => {
    haptic('select');
    if (on && Platform.OS !== 'web') {
      const ok = await ensurePermission();
      setPerm(ok ? 'granted' : 'denied');
      if (!ok) {
        Alert.alert('Notifications are off', 'Turn on notifications for Last Time in iPhone Settings to get reminders.', [
          { text: 'Not now', style: 'cancel' },
          { text: 'Open Settings', onPress: () => Linking.openSettings() },
        ]);
        return;
      }
    }
    updateSettings({ remindersOn: on });
  };

  const logs = items.reduce((n, i) => n + i.logs.length, 0);
  const version = Constants.expoConfig?.version ?? '1.0.0';

  return (
    <View style={{ flex: 1, backgroundColor: t.bg }}>
      <View style={[styles.nav, { paddingTop: insets.top + 6, backgroundColor: t.bg }]}>
        <IconButton icon="chevron-back" label="Back" onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))} />
        <Text style={[styles.navTitle, { color: t.ink }]}>Settings</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 18, paddingBottom: insets.bottom + 40 }}>
        <SectionLabel>Reminders</SectionLabel>
        <Group>
          <Row icon="notifications-outline" label="Morning reminders">
            <Toggle
              label="Morning reminders"
              value={settings.remindersOn && (perm !== 'denied' || Platform.OS === 'web')}
              onChange={toggleReminders}
            />
          </Row>
          {perm === 'denied' && Platform.OS !== 'web' && (
            <Pressable onPress={() => Linking.openSettings()} style={styles.warnRow}>
              <Text style={[styles.warn, { color: t.overdue }]}>
                Notifications are blocked. Tap to open Settings and allow them.
              </Text>
            </Pressable>
          )}
          <Row icon="time-outline" label="Remind me at">
            <Text style={[styles.value, { color: t.inkSoft }]}>{formatHour(settings.reminderHour, settings.reminderMinute)}</Text>
          </Row>
          <View style={styles.hours}>
            {HOURS.map((h) => {
              const on = settings.reminderHour === h && settings.reminderMinute === 0;
              return (
                <Pressable
                  key={h}
                  onPress={() => {
                    haptic('select');
                    updateSettings({ reminderHour: h, reminderMinute: 0 });
                  }}
                  style={[styles.hour, on ? { backgroundColor: t.ink, borderColor: t.ink } : { borderColor: t.line }]}
                >
                  <Text style={[styles.hourText, { color: on ? t.bg : t.ink }]}>{formatHour(h).replace(':00', '')}</Text>
                </Pressable>
              );
            })}
          </View>
          <Row icon="apps-outline" label="Overdue count on app icon">
            <Toggle
              label="Overdue count on app icon"
              value={settings.badge}
              onChange={(v) => {
                haptic('select');
                updateSettings({ badge: v });
              }}
            />
          </Row>
          <Row
            icon="paper-plane-outline"
            label="Send a test reminder"
            last
            onPress={async () => {
              const ok = await sendTestNotification();
              toast({ emoji: ok ? '🔔' : '🔕', message: ok ? 'Arriving in 3 seconds…' : 'Notifications aren’t allowed' });
            }}
          />
        </Group>

        <SectionLabel>Feel</SectionLabel>
        <Group>
          <Row icon="pulse-outline" label="Haptics" last>
            <Toggle label="Haptics" value={settings.haptics} onChange={(v) => updateSettings({ haptics: v })} />
          </Row>
        </Group>

        <SectionLabel>Your data</SectionLabel>
        <Group>
          <Row
            icon="share-outline"
            label="Export backup"
            onPress={async () => {
              try {
                await exportBackup(exportData());
              } catch {
                toast({ emoji: '⚠️', message: 'Couldn’t create the backup' });
              }
            }}
          />
          <Row
            icon="download-outline"
            label="Restore from backup"
            onPress={async () => {
              try {
                const data = await pickBackup();
                if (!data) return;
                confirm(
                  'Restore this backup?',
                  `It has ${data.items.length} things. This replaces everything currently in the app.`,
                  'Restore',
                  () => {
                    replaceAll(data);
                    haptic('success');
                    toast({ emoji: '✅', message: `Restored ${data.items.length} things` });
                  },
                );
              } catch (e) {
                toast({ emoji: '⚠️', message: e instanceof Error ? e.message : 'Couldn’t read that file' });
              }
            }}
          />
          <Row
            icon="trash-outline"
            label="Erase everything"
            danger
            last
            onPress={() =>
              confirm('Erase everything?', 'All your things and their history will be deleted. This can’t be undone.', 'Erase', () => {
                resetAll();
                router.replace('/welcome');
              })
            }
          />
        </Group>
        <Text style={[styles.foot, { color: t.inkFaint }]}>
          {items.length} things · {logs} entries. Everything is stored only on this iPhone and included in your iCloud
          device backup. No accounts, no tracking, no ads.
        </Text>

        <SectionLabel>About</SectionLabel>
        <Group>
          <Row
            icon="star-outline"
            label="Rate Last Time"
            onPress={() => Linking.openURL('https://apps.apple.com/app/id0000000000?action=write-review').catch(() => {})}
          />
          <Row
            icon="mail-outline"
            label="Send feedback"
            onPress={() => Linking.openURL('mailto:support@revvlaunch.com?subject=Last%20Time%20feedback').catch(() => {})}
          />
          <Row
            icon="lock-closed-outline"
            label="Privacy policy"
            last
            onPress={() => Linking.openURL('https://revvlaunch.com/last-time/privacy').catch(() => {})}
          />
        </Group>
        <Text style={[styles.version, { color: t.inkFaint }]}>Last Time {version} · Made in Reno</Text>
      </ScrollView>
    </View>
  );
}

function Group({ children }: { children: React.ReactNode }) {
  const t = useTheme();
  return <View style={[styles.group, { backgroundColor: t.card, borderColor: t.line }]}>{children}</View>;
}

function Row({
  icon,
  label,
  children,
  onPress,
  last,
  danger,
}: {
  icon: IconName;
  label: string;
  children?: React.ReactNode;
  onPress?: () => void;
  last?: boolean;
  danger?: boolean;
}) {
  const t = useTheme();
  const color = danger ? t.overdue : t.ink;
  return (
    <Pressable
      disabled={!onPress}
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        !last && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: t.line },
        pressed && { backgroundColor: t.cardPressed },
      ]}
    >
      <Ionicons name={icon} size={21} color={danger ? t.overdue : t.inkSoft} style={{ width: 24, textAlign: 'center' }} />
      <Text style={[styles.rowLabel, { color }]}>{label}</Text>
      {children ?? (onPress ? <Ionicons name="chevron-forward" size={18} color={t.inkFaint} /> : null)}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  nav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingBottom: 4 },
  navTitle: { fontSize: 18, fontWeight: '800', fontFamily: display },
  group: { borderRadius: radius.lg, borderWidth: StyleSheet.hairlineWidth * 2, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 14, minHeight: 54 },
  rowLabel: { flex: 1, fontSize: 16, fontWeight: '600' },
  value: { fontSize: 16, fontWeight: '600' },
  warnRow: { paddingHorizontal: 14, paddingBottom: 12 },
  warn: { fontSize: 14, fontWeight: '600' },
  hours: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, paddingHorizontal: 14, paddingBottom: 14 },
  hour: { paddingHorizontal: 11, height: 32, borderRadius: 16, borderWidth: 1, justifyContent: 'center' },
  hourText: { fontSize: 13, fontWeight: '700' },
  foot: { fontSize: 13, lineHeight: 19, marginTop: 10, paddingHorizontal: 6 },
  version: { textAlign: 'center', fontSize: 13, marginTop: 24 },
});
