import { router, useLocalSearchParams } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CalendarPicker } from '../components/CalendarPicker';
import { useToast } from '../components/Toast';
import { Button } from '../components/ui';
import { useItem, useStore } from '../lib/store';
import { accentColor, display, radius, useTheme } from '../lib/theme';
import { agoLabel, DAY, daysBetween, formatLong, startOfDay, timestampForDay } from '../lib/time';

export default function LogSheet() {
  const { id, logId } = useLocalSearchParams<{ id: string; logId?: string }>();
  const item = useItem(id);
  const existing = item?.logs.find((l) => l.id === logId);
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const { log, updateLog, deleteLog, haptic, now } = useStore();
  const toast = useToast();

  const today = startOfDay(now);
  const [day, setDay] = useState(() => (existing ? startOfDay(existing.at) : startOfDay(now) - DAY));
  const [note, setNote] = useState(existing?.note ?? '');

  const marked = useMemo(() => new Set((item?.logs ?? []).map((l) => startOfDay(l.at))), [item]);

  if (!item) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: t.sheet }}>
        <Text style={{ color: t.inkSoft }}>Not found.</Text>
      </View>
    );
  }
  const a = accentColor(item.color, t);

  const quick = [
    { label: 'Today', d: today },
    { label: 'Yesterday', d: today - DAY },
    { label: '2 days ago', d: today - 2 * DAY },
    { label: 'Last week', d: today - 7 * DAY },
  ];

  const save = () => {
    const trimmed = note.trim();
    if (existing) {
      const sameDay = startOfDay(existing.at) === day;
      updateLog(item.id, existing.id, { at: sameDay ? existing.at : timestampForDay(day), note: trimmed || undefined });
    } else {
      log(item.id, timestampForDay(day), trimmed || undefined);
      toast({ emoji: item.emoji, message: `Logged ${agoLabel(daysBetween(day, Date.now())).toLowerCase()}` });
    }
    haptic('success');
    router.back();
  };

  const remove = () => {
    if (!existing) return;
    const snapshot = existing;
    deleteLog(item.id, existing.id);
    haptic('warning');
    router.back();
    toast({
      emoji: '🗑️',
      message: 'Entry removed',
      action: { label: 'Undo', onPress: () => log(item.id, snapshot.at, snapshot.note) },
    });
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: t.sheet }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={[styles.bar, { borderBottomColor: t.line, paddingTop: Platform.OS === 'android' ? insets.top + 8 : 14 }]}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Text style={[styles.barBtn, { color: t.inkSoft }]}>Cancel</Text>
        </Pressable>
        <Text style={[styles.barTitle, { color: t.ink }]} numberOfLines={1}>
          {item.emoji} {existing ? 'Edit entry' : 'When did you do it?'}
        </Text>
        <Pressable onPress={save} hitSlop={12}>
          <Text style={[styles.barBtn, { color: t.accent, fontWeight: '800' }]}>Save</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: insets.bottom + 40 }} keyboardShouldPersistTaps="handled">
        <Text style={[styles.itemTitle, { color: t.inkSoft }]}>{item.title}</Text>
        <Text style={[styles.picked, { color: t.ink }]}>{formatLong(day)}</Text>

        <View style={styles.quick}>
          {quick.map((q) => {
            const on = q.d === day;
            return (
              <Pressable
                key={q.label}
                onPress={() => {
                  haptic('select');
                  setDay(q.d);
                }}
                style={[styles.qChip, on ? { backgroundColor: a.main, borderColor: a.main } : { borderColor: t.line, backgroundColor: t.bg }]}
              >
                <Text style={[styles.qText, { color: on ? '#fff' : t.ink }]}>{q.label}</Text>
              </Pressable>
            );
          })}
        </View>

        <View style={[styles.cal, { backgroundColor: t.bg, borderColor: t.line }]}>
          <CalendarPicker
            key={day}
            value={day}
            onChange={(d) => {
              haptic('select');
              setDay(d);
            }}
            marked={marked}
            color={a.main}
          />
        </View>

        <TextInput
          value={note}
          onChangeText={setNote}
          placeholder="Add a note (optional)"
          placeholderTextColor={t.inkFaint}
          style={[styles.note, { color: t.ink, backgroundColor: t.bg, borderColor: t.line }]}
          maxLength={200}
          returnKeyType="done"
          onSubmitEditing={save}
        />

        <Button title={existing ? 'Save entry' : 'Log it'} onPress={save} color={a.main} style={{ marginTop: 20 }} />
        {existing && <Button title="Delete this entry" kind="danger" icon="trash-outline" onPress={remove} style={{ marginTop: 10 }} />}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 12,
  },
  barBtn: { fontSize: 17, fontWeight: '600', fontFamily: display },
  barTitle: { fontSize: 17, fontWeight: '800', fontFamily: display, flexShrink: 1 },
  itemTitle: { fontSize: 15, fontWeight: '600' },
  picked: { fontSize: 26, fontWeight: '800', fontFamily: display, marginTop: 2, letterSpacing: -0.4 },
  quick: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 16 },
  qChip: { paddingHorizontal: 14, height: 38, borderRadius: 19, borderWidth: 1.5, justifyContent: 'center' },
  qText: { fontSize: 15, fontWeight: '700', fontFamily: display },
  cal: { marginTop: 16, padding: 12, borderRadius: radius.lg, borderWidth: StyleSheet.hairlineWidth * 2 },
  note: {
    marginTop: 16,
    height: 52,
    borderRadius: radius.md,
    paddingHorizontal: 14,
    fontSize: 16,
    borderWidth: StyleSheet.hairlineWidth * 2,
  },
});
