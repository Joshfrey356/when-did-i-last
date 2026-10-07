import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button, Tap } from '../components/ui';
import { ensurePermission } from '../lib/reminders';
import { useStore } from '../lib/store';
import { TEMPLATE_GROUPS, type Template } from '../lib/templates';
import { accentColor, display, radius, useTheme } from '../lib/theme';

const PREVIEW = [
  { emoji: '🌬️', title: 'Changed the furnace filter', ago: '104 days ago', due: '14 days overdue', s: 'overdue' },
  { emoji: '📞', title: 'Called Mom', ago: '6 days ago', due: 'Due tomorrow', s: 'soon' },
  { emoji: '💈', title: 'Haircut', ago: '24 days ago', due: 'Due in 6 days', s: 'fresh' },
] as const;

const DEFAULT_PICKS = ['Changed the furnace filter', 'Called Mom', 'Haircut', 'Oil change', 'Washed the sheets'];

export default function Welcome() {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const { addItems, updateSettings, haptic } = useStore();
  const [step, setStep] = useState<0 | 1 | 2>(0);
  const [picked, setPicked] = useState<Set<string>>(new Set(DEFAULT_PICKS));

  const all: Template[] = TEMPLATE_GROUPS.flatMap((g) => g.items);

  const finish = async (askReminders: boolean) => {
    let on = false;
    if (askReminders) on = await ensurePermission();
    const chosen = all.filter((tpl) => picked.has(tpl.title));
    // de-dupe by title (some templates share emoji, not titles)
    const seen = new Set<string>();
    addItems(
      chosen
        .filter((c) => (seen.has(c.title) ? false : (seen.add(c.title), true)))
        .map((c) => ({ title: c.title, emoji: c.emoji, color: c.color, intervalDays: c.intervalDays })),
    );
    updateSettings({ onboarded: true, remindersOn: on || Platform.OS === 'web' });
    haptic('success');
    router.replace('/');
  };

  if (step === 0) {
    return (
      <View style={[styles.fill, { backgroundColor: t.bg, paddingTop: insets.top + 40, paddingBottom: insets.bottom + 20 }]}>
        <View style={styles.pad}>
          <Text style={[styles.kicker, { color: t.accent }]}>Last Time</Text>
          <Text style={[styles.hero, { color: t.ink }]}>When did I last…?</Text>
          <Text style={[styles.lede, { color: t.inkSoft }]}>
            One tap when you do something. Last Time remembers the date and nudges you when it’s due again.
          </Text>
        </View>

        <View style={[styles.pad, { marginTop: 34, gap: 10 }]}>
          {PREVIEW.map((p, i) => {
            const fg = p.s === 'overdue' ? t.overdue : p.s === 'soon' ? t.soon : t.fresh;
            return (
              <View
                key={p.title}
                style={[
                  styles.previewCard,
                  { backgroundColor: t.card, borderColor: t.line, transform: [{ rotate: `${[-1.2, 0.8, -0.4][i]}deg` }] },
                ]}
              >
                <Text style={{ fontSize: 26 }}>{p.emoji}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.pTitle, { color: t.ink }]}>{p.title}</Text>
                  <Text style={[styles.pMeta, { color: t.inkSoft }]}>
                    {p.ago} · <Text style={{ color: fg }}>{p.due}</Text>
                  </Text>
                </View>
                <View style={[styles.pCheck, { borderColor: t.line }]}>
                  <Ionicons name="checkmark" size={18} color={t.inkFaint} />
                </View>
              </View>
            );
          })}
        </View>

        <View style={{ flex: 1 }} />
        <View style={styles.pad}>
          <Button title="Get started" onPress={() => setStep(1)} />
          <Text style={[styles.fine, { color: t.inkFaint }]}>No account. Everything stays on your phone.</Text>
        </View>
      </View>
    );
  }

  if (step === 1) {
    return (
      <View style={[styles.fill, { backgroundColor: t.bg }]}>
        <ScrollView contentContainerStyle={{ paddingTop: insets.top + 28, paddingBottom: 140, paddingHorizontal: 22 }}>
          <Text style={[styles.h1, { color: t.ink }]}>What do you lose track of?</Text>
          <Text style={[styles.lede, { color: t.inkSoft, marginTop: 8 }]}>
            Pick a few to start. You can change the reminders or add your own anytime.
          </Text>
          {TEMPLATE_GROUPS.map((g) => (
            <View key={g.name} style={{ marginTop: 22 }}>
              <Text style={[styles.group, { color: t.inkSoft }]}>{g.name.toUpperCase()}</Text>
              <View style={styles.chips}>
                {g.items.map((tpl) => {
                  const on = picked.has(tpl.title);
                  const a = accentColor(tpl.color, t);
                  return (
                    <Tap
                      key={tpl.title}
                      scale={0.95}
                      onPress={() => {
                        haptic('select');
                        setPicked((prev) => {
                          const n = new Set(prev);
                          if (n.has(tpl.title)) n.delete(tpl.title);
                          else n.add(tpl.title);
                          return n;
                        });
                      }}
                      accessibilityRole="checkbox"
                      accessibilityState={{ checked: on }}
                      style={[
                        styles.chip,
                        on
                          ? { backgroundColor: a.soft, borderColor: a.main }
                          : { backgroundColor: t.card, borderColor: t.line },
                      ]}
                    >
                      <Text style={{ fontSize: 17 }}>{tpl.emoji}</Text>
                      <Text style={[styles.chipText, { color: on ? a.main : t.ink }]}>{tpl.title}</Text>
                      {on && <Ionicons name="checkmark-circle" size={18} color={a.main} />}
                    </Tap>
                  );
                })}
              </View>
            </View>
          ))}
        </ScrollView>
        <View style={[styles.footer, { paddingBottom: insets.bottom + 16, backgroundColor: t.bg, borderTopColor: t.line }]}>
          <Button
            title={picked.size ? `Add ${picked.size} thing${picked.size === 1 ? '' : 's'}` : 'Start empty'}
            onPress={() => setStep(2)}
          />
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.fill, { backgroundColor: t.bg, paddingTop: insets.top + 60, paddingBottom: insets.bottom + 20 }]}>
      <View style={[styles.pad, { alignItems: 'center' }]}>
        <View style={[styles.bell, { backgroundColor: t.isDark ? '#3A2219' : '#FDE3D9' }]}>
          <Ionicons name="notifications" size={44} color={t.accent} />
        </View>
        <Text style={[styles.h1, { color: t.ink, textAlign: 'center', marginTop: 26 }]}>Want a nudge when it’s time?</Text>
        <Text style={[styles.lede, { color: t.inkSoft, textAlign: 'center', marginTop: 10 }]}>
          One quiet reminder in the morning when something is due. Never more than one a day.
        </Text>

        <View style={[styles.notif, { backgroundColor: t.card, borderColor: t.line }]}>
          <View style={[styles.notifIcon, { backgroundColor: t.accent }]}>
            <Ionicons name="time" size={16} color="#fff" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.notifTitle, { color: t.ink }]}>🌬️ Changed the furnace filter</Text>
            <Text style={[styles.notifBody, { color: t.inkSoft }]}>It’s time again. Last done 90 days ago.</Text>
          </View>
          <Text style={[styles.notifTime, { color: t.inkFaint }]}>9:00 AM</Text>
        </View>
      </View>
      <View style={{ flex: 1 }} />
      <View style={[styles.pad, { gap: 8 }]}>
        <Button title="Turn on reminders" icon="notifications-outline" onPress={() => finish(true)} />
        <Button title="Not now" kind="ghost" onPress={() => finish(false)} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  pad: { paddingHorizontal: 24 },
  kicker: { fontSize: 17, fontWeight: '800', fontFamily: display },
  hero: { fontSize: 46, lineHeight: 50, fontWeight: '800', fontFamily: display, letterSpacing: -1.4, marginTop: 10 },
  h1: { fontSize: 32, lineHeight: 37, fontWeight: '800', fontFamily: display, letterSpacing: -0.8 },
  lede: { fontSize: 18, lineHeight: 26, marginTop: 14 },
  previewCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth * 2,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  pTitle: { fontSize: 16, fontWeight: '700', fontFamily: display },
  pMeta: { fontSize: 14, fontWeight: '600', marginTop: 2 },
  pCheck: { width: 34, height: 34, borderRadius: 17, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  fine: { textAlign: 'center', fontSize: 14, marginTop: 14 },
  group: { fontSize: 13, fontWeight: '700', letterSpacing: 0.8, marginBottom: 10 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingHorizontal: 13,
    height: 42,
    borderRadius: 21,
    borderWidth: 1.5,
  },
  chipText: { fontSize: 15, fontWeight: '700', fontFamily: display },
  footer: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: 22, paddingTop: 12, borderTopWidth: StyleSheet.hairlineWidth },
  bell: { width: 96, height: 96, borderRadius: 30, alignItems: 'center', justifyContent: 'center' },
  notif: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 32,
    padding: 14,
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth * 2,
    width: '100%',
  },
  notifIcon: { width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  notifTitle: { fontSize: 15, fontWeight: '700' },
  notifBody: { fontSize: 14, marginTop: 2 },
  notifTime: { fontSize: 12, alignSelf: 'flex-start' },
});
