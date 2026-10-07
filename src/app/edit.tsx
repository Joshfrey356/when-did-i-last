import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CalendarPicker } from '../components/CalendarPicker';
import { Button, SectionLabel, Tap } from '../components/ui';
import { ensurePermission } from '../lib/reminders';
import { uid, useItem, useStore } from '../lib/store';
import { EMOJI_CHOICES, TEMPLATE_GROUPS, type Template } from '../lib/templates';
import { ACCENT_KEYS, accentColor, display, radius, useTheme, type AccentKey } from '../lib/theme';
import { INTERVAL_PRESETS, startOfDay, timestampForDay } from '../lib/time';
import { useItemActions } from '../lib/useActions';

type LastChoice = 'never' | 'today' | 'pick';

export default function EditItem() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const existing = useItem(id);
  const isNew = !existing;
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const { addItem, updateItem, settings, updateSettings, haptic } = useStore();
  const actions = useItemActions();

  const [title, setTitle] = useState(existing?.title ?? '');
  const [emoji, setEmoji] = useState(existing?.emoji ?? '✅');
  const [color, setColor] = useState<AccentKey>(existing?.color ?? 'tangerine');
  const [interval, setIntervalDays] = useState<number | null>(existing ? existing.intervalDays : 30);
  const [custom, setCustom] = useState(
    existing?.intervalDays != null && !INTERVAL_PRESETS.some((p) => p.days === existing.intervalDays),
  );
  const [notes, setNotes] = useState(existing?.notes ?? '');
  const [showEmoji, setShowEmoji] = useState(false);
  const [last, setLast] = useState<LastChoice>('never');
  const [lastDay, setLastDay] = useState(() => startOfDay(Date.now()));

  const a = accentColor(color, t);
  const canSave = title.trim().length > 0;

  const applyTemplate = (tpl: Template) => {
    haptic('select');
    setTitle(tpl.title);
    setEmoji(tpl.emoji);
    setColor(tpl.color);
    setIntervalDays(tpl.intervalDays);
    setCustom(false);
  };

  const save = async () => {
    if (!canSave) return;
    const base = {
      title: title.trim(),
      emoji,
      color,
      intervalDays: interval && interval > 0 ? Math.round(interval) : null,
      notes: notes.trim() || undefined,
    };
    if (existing) {
      updateItem(existing.id, base);
    } else {
      const logs =
        last === 'today'
          ? [{ id: uid(), at: Date.now() }]
          : last === 'pick'
            ? [{ id: uid(), at: timestampForDay(lastDay) }]
            : [];
      addItem({ ...base, logs });
    }
    haptic('success');
    router.back();
    if (base.intervalDays && settings.remindersOn) {
      const ok = await ensurePermission();
      if (!ok && Platform.OS !== 'web') updateSettings({ remindersOn: false });
    }
  };

  const suggestions = TEMPLATE_GROUPS.flatMap((g) => g.items);
  const q = title.trim().toLowerCase();
  const matches = q ? suggestions.filter((s) => s.title.toLowerCase().includes(q) && s.title !== title).slice(0, 6) : suggestions.slice(0, 8);

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: t.sheet }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={[styles.bar, { borderBottomColor: t.line, paddingTop: Platform.OS === 'android' ? insets.top + 8 : 14 }]}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Text style={[styles.barBtn, { color: t.inkSoft }]}>Cancel</Text>
        </Pressable>
        <Text style={[styles.barTitle, { color: t.ink }]}>{isNew ? 'Track something' : 'Edit'}</Text>
        <Pressable onPress={save} disabled={!canSave} hitSlop={12}>
          <Text style={[styles.barBtn, { color: canSave ? t.accent : t.inkFaint, fontWeight: '800' }]}>
            {isNew ? 'Add' : 'Save'}
          </Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: insets.bottom + 40 }} keyboardShouldPersistTaps="handled">
        <View style={styles.nameRow}>
          <Tap
            onPress={() => {
              haptic('select');
              setShowEmoji((s) => !s);
            }}
            accessibilityLabel="Choose an emoji"
            style={[styles.emojiBtn, { backgroundColor: a.soft, borderColor: showEmoji ? a.main : 'transparent' }]}
          >
            <Text style={{ fontSize: 34 }}>{emoji}</Text>
          </Tap>
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder="What do you want to track?"
            placeholderTextColor={t.inkFaint}
            style={[styles.titleInput, { color: t.ink, backgroundColor: t.bg, borderColor: t.line }]}
            autoFocus={isNew}
            returnKeyType="done"
            maxLength={60}
            onSubmitEditing={save}
          />
        </View>

        {showEmoji && (
          <View style={[styles.emojiGrid, { backgroundColor: t.bg, borderColor: t.line }]}>
            {EMOJI_CHOICES.map((e) => (
              <Pressable
                key={e}
                onPress={() => {
                  haptic('select');
                  setEmoji(e);
                  setShowEmoji(false);
                }}
                style={[styles.emojiCell, e === emoji && { backgroundColor: a.soft }]}
              >
                <Text style={{ fontSize: 26 }}>{e}</Text>
              </Pressable>
            ))}
          </View>
        )}

        {isNew && matches.length > 0 && (
          <>
            <SectionLabel>{q ? 'Did you mean' : 'Ideas'}</SectionLabel>
            <View style={styles.chips}>
              {matches.map((s) => (
                <Tap
                  key={s.title}
                  scale={0.95}
                  onPress={() => applyTemplate(s)}
                  style={[styles.chip, { backgroundColor: t.bg, borderColor: t.line }]}
                >
                  <Text style={{ fontSize: 15 }}>{s.emoji}</Text>
                  <Text style={[styles.chipText, { color: t.ink }]}>{s.title}</Text>
                </Tap>
              ))}
            </View>
          </>
        )}

        <SectionLabel>Color</SectionLabel>
        <View style={styles.swatches}>
          {ACCENT_KEYS.map((k) => {
            const c = accentColor(k, t);
            const on = k === color;
            return (
              <Pressable
                key={k}
                onPress={() => {
                  haptic('select');
                  setColor(k);
                }}
                accessibilityLabel={`${k} color`}
                accessibilityState={{ selected: on }}
                style={[styles.swatchRing, { borderColor: on ? c.main : 'transparent' }]}
              >
                <View style={[styles.swatch, { backgroundColor: c.main }]} />
              </Pressable>
            );
          })}
        </View>

        <SectionLabel>Remind me</SectionLabel>
        <View style={styles.chips}>
          <Seg label="Never" on={interval == null && !custom} color={a.main} onPress={() => { setIntervalDays(null); setCustom(false); }} />
          {INTERVAL_PRESETS.map((p) => (
            <Seg
              key={p.days}
              label={p.short}
              on={!custom && interval === p.days}
              color={a.main}
              onPress={() => {
                setIntervalDays(p.days);
                setCustom(false);
              }}
            />
          ))}
          <Seg
            label="Custom"
            on={custom}
            color={a.main}
            onPress={() => {
              setCustom(true);
              setIntervalDays((v) => v ?? 10);
            }}
          />
        </View>
        {custom && (
          <View style={[styles.stepper, { backgroundColor: t.bg, borderColor: t.line }]}>
            <StepBtn icon="remove" onPress={() => setIntervalDays((v) => Math.max(1, (v ?? 1) - 1))} />
            <View style={{ alignItems: 'center' }}>
              <Text style={[styles.stepVal, { color: t.ink }]}>{interval ?? 1}</Text>
              <Text style={[styles.stepUnit, { color: t.inkSoft }]}>{interval === 1 ? 'day' : 'days'}</Text>
            </View>
            <StepBtn icon="add" onPress={() => setIntervalDays((v) => Math.min(3650, (v ?? 0) + 1))} />
          </View>
        )}
        <Text style={[styles.help, { color: t.inkFaint }]}>
          {interval
            ? `We’ll nudge you ${interval} day${interval === 1 ? '' : 's'} after the last time you did it.`
            : 'No reminders. Last Time will just keep count.'}
        </Text>

        {isNew && (
          <>
            <SectionLabel>Last time you did it</SectionLabel>
            <View style={styles.chips}>
              <Seg label="Not sure" on={last === 'never'} color={a.main} onPress={() => setLast('never')} />
              <Seg label="Today" on={last === 'today'} color={a.main} onPress={() => setLast('today')} />
              <Seg label="Pick a day" on={last === 'pick'} color={a.main} onPress={() => setLast('pick')} />
            </View>
            {last === 'pick' && (
              <View style={[styles.calWrap, { backgroundColor: t.bg, borderColor: t.line }]}>
                <CalendarPicker value={lastDay} onChange={setLastDay} color={a.main} />
              </View>
            )}
          </>
        )}

        <SectionLabel>Notes</SectionLabel>
        <TextInput
          value={notes}
          onChangeText={setNotes}
          placeholder="Filter size, who to call, part number…"
          placeholderTextColor={t.inkFaint}
          multiline
          style={[styles.notes, { color: t.ink, backgroundColor: t.bg, borderColor: t.line }]}
          maxLength={500}
        />

        <Button title={isNew ? 'Add it' : 'Save changes'} onPress={save} disabled={!canSave} color={a.main} style={{ marginTop: 26 }} />
        {existing && (
          <Button
            title="Delete"
            kind="danger"
            icon="trash-outline"
            onPress={() => actions.remove(existing, () => router.dismissAll())}
            style={{ marginTop: 10 }}
          />
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Seg({ label, on, color, onPress }: { label: string; on: boolean; color: string; onPress: () => void }) {
  const t = useTheme();
  const { haptic } = useStore();
  return (
    <Pressable
      onPress={() => {
        haptic('select');
        onPress();
      }}
      accessibilityRole="radio"
      accessibilityState={{ selected: on }}
      style={[styles.seg, on ? { backgroundColor: color, borderColor: color } : { backgroundColor: t.bg, borderColor: t.line }]}
    >
      <Text style={[styles.segText, { color: on ? '#fff' : t.ink }]}>{label}</Text>
    </Pressable>
  );
}

function StepBtn({ icon, onPress }: { icon: 'add' | 'remove'; onPress: () => void }) {
  const t = useTheme();
  const { haptic } = useStore();
  return (
    <Tap
      scale={0.9}
      onPress={() => {
        haptic('select');
        onPress();
      }}
      style={[styles.stepBtn, { backgroundColor: t.card, borderColor: t.line }]}
      accessibilityLabel={icon === 'add' ? 'More days' : 'Fewer days'}
    >
      <Ionicons name={icon} size={24} color={t.ink} />
    </Tap>
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
  },
  barBtn: { fontSize: 17, fontWeight: '600', fontFamily: display },
  barTitle: { fontSize: 17, fontWeight: '800', fontFamily: display },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  emojiBtn: { width: 64, height: 64, borderRadius: 20, alignItems: 'center', justifyContent: 'center', borderWidth: 2 },
  titleInput: {
    flex: 1,
    minWidth: 0,
    height: 64,
    borderRadius: radius.md,
    paddingHorizontal: 16,
    fontSize: 18,
    fontWeight: '700',
    fontFamily: display,
    borderWidth: StyleSheet.hairlineWidth * 2,
  },
  emojiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 12,
    padding: 8,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth * 2,
  },
  emojiCell: { width: '12.5%', aspectRatio: 1, alignItems: 'center', justifyContent: 'center', borderRadius: 12 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    height: 38,
    borderRadius: 19,
    borderWidth: StyleSheet.hairlineWidth * 2,
  },
  chipText: { fontSize: 14, fontWeight: '600' },
  swatches: { flexDirection: 'row', justifyContent: 'space-between' },
  swatchRing: { width: 40, height: 40, borderRadius: 20, borderWidth: 2.5, alignItems: 'center', justifyContent: 'center' },
  swatch: { width: 28, height: 28, borderRadius: 14 },
  seg: { paddingHorizontal: 14, height: 38, borderRadius: 19, borderWidth: 1.5, justifyContent: 'center' },
  segText: { fontSize: 15, fontWeight: '700', fontFamily: display },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
    padding: 10,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth * 2,
  },
  stepBtn: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center', borderWidth: StyleSheet.hairlineWidth * 2 },
  stepVal: { fontSize: 32, fontWeight: '800', fontFamily: display, fontVariant: ['tabular-nums'] },
  stepUnit: { fontSize: 13, fontWeight: '600', marginTop: -2 },
  help: { fontSize: 14, marginTop: 10, lineHeight: 20 },
  calWrap: { marginTop: 12, padding: 12, borderRadius: radius.lg, borderWidth: StyleSheet.hairlineWidth * 2 },
  notes: {
    minHeight: 96,
    borderRadius: radius.md,
    padding: 14,
    fontSize: 16,
    lineHeight: 22,
    textAlignVertical: 'top',
    borderWidth: StyleSheet.hairlineWidth * 2,
  },
});
