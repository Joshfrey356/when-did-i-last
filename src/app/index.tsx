import Ionicons from '@expo/vector-icons/Ionicons';
import { Redirect, router } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ItemCard } from '../components/ItemCard';
import { IconButton, SectionLabel, Tap } from '../components/ui';
import { useStore } from '../lib/store';
import { display, radius, useTheme } from '../lib/theme';
import { itemState, type ItemState } from '../lib/time';
import type { Item, SortMode } from '../lib/types';
import { useItemActions } from '../lib/useActions';

type Row = { item: Item; state: ItemState };

const SORTS: { key: SortMode; label: string }[] = [
  { key: 'due', label: 'Due' },
  { key: 'recent', label: 'Recent' },
  { key: 'oldest', label: 'Longest ago' },
  { key: 'az', label: 'A–Z' },
];

function urgency(r: Row) {
  // lower = more urgent
  if (r.state.status === 'overdue' || r.state.status === 'soon' || r.state.status === 'fresh') return r.state.daysLeft!;
  if (r.state.status === 'never') return 1e6;
  return 1e7 - (r.state.daysAgo ?? 0);
}

export default function Home() {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const { ready, items, settings, now, updateSettings, haptic } = useStore();
  const actions = useItemActions();
  const [query, setQuery] = useState('');

  const rows = useMemo<Row[]>(() => items.map((item) => ({ item, state: itemState(item, now) })), [items, now]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? rows.filter((r) => r.item.title.toLowerCase().includes(q)) : rows;
  }, [rows, query]);

  const sections = useMemo(() => {
    const list = [...filtered];
    if (settings.sort === 'due') {
      list.sort((a, b) => urgency(a) - urgency(b));
      const groups: { title: string; rows: Row[] }[] = [
        { title: 'Overdue', rows: list.filter((r) => r.state.status === 'overdue') },
        { title: 'Coming up', rows: list.filter((r) => r.state.status === 'soon') },
        { title: 'On track', rows: list.filter((r) => r.state.status === 'fresh') },
        { title: 'Just tracking', rows: list.filter((r) => r.state.status === 'tracking') },
        { title: 'Not logged yet', rows: list.filter((r) => r.state.status === 'never') },
      ];
      return groups.filter((g) => g.rows.length);
    }
    if (settings.sort === 'az') list.sort((a, b) => a.item.title.localeCompare(b.item.title));
    if (settings.sort === 'recent') list.sort((a, b) => (b.state.last ?? 0) - (a.state.last ?? 0));
    if (settings.sort === 'oldest')
      list.sort((a, b) => (a.state.last ?? -Infinity) - (b.state.last ?? -Infinity));
    return [{ title: '', rows: list }];
  }, [filtered, settings.sort]);

  if (!ready) {
    return (
      <View style={[styles.center, { backgroundColor: t.bg }]}>
        <ActivityIndicator color={t.accent} />
      </View>
    );
  }
  if (!settings.onboarded) return <Redirect href="/welcome" />;

  const overdue = rows.filter((r) => r.state.status === 'overdue').length;
  const soon = rows.filter((r) => r.state.status === 'soon').length;
  const doneToday = rows.filter((r) => r.state.daysAgo === 0).length;

  const headline =
    items.length === 0
      ? 'Nothing here yet.'
      : overdue > 0
        ? `${overdue} thing${overdue === 1 ? ' is' : 's are'} overdue.`
        : soon > 0
          ? `${soon} thing${soon === 1 ? ' is' : 's are'} coming up.`
          : 'You’re all caught up.';

  return (
    <View style={{ flex: 1, backgroundColor: t.bg }}>
      <ScrollView
        contentContainerStyle={{ paddingTop: insets.top + 8, paddingBottom: insets.bottom + 120, paddingHorizontal: 18 }}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
      >
        <View style={styles.topRow}>
          <Text style={[styles.brand, { color: t.accent }]}>Last Time</Text>
          <IconButton icon="settings-outline" label="Settings" onPress={() => router.push('/settings')} />
        </View>

        <Text style={[styles.headline, { color: t.ink }]}>{headline}</Text>
        {items.length > 0 && (
          <View style={styles.stats}>
            <Stat n={overdue} label="overdue" color={t.overdue} bg={t.overdueSoft} />
            <Stat n={soon} label="coming up" color={t.soon} bg={t.soonSoft} />
            <Stat n={doneToday} label="done today" color={t.fresh} bg={t.freshSoft} />
          </View>
        )}

        {items.length > 5 && (
          <View style={[styles.search, { backgroundColor: t.card, borderColor: t.line }]}>
            <Ionicons name="search" size={18} color={t.inkFaint} />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Search"
              placeholderTextColor={t.inkFaint}
              style={[styles.searchInput, { color: t.ink }]}
              returnKeyType="search"
              clearButtonMode="while-editing"
              autoCorrect={false}
            />
          </View>
        )}

        {items.length > 1 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.sorts} contentContainerStyle={{ gap: 8 }}>
            {SORTS.map((s) => {
              const on = settings.sort === s.key;
              return (
                <Pressable
                  key={s.key}
                  onPress={() => {
                    haptic('select');
                    updateSettings({ sort: s.key });
                  }}
                  style={[
                    styles.chip,
                    { backgroundColor: on ? t.ink : 'transparent', borderColor: on ? t.ink : t.line },
                  ]}
                >
                  <Text style={[styles.chipText, { color: on ? t.bg : t.inkSoft }]}>{s.label}</Text>
                </Pressable>
              );
            })}
          </ScrollView>
        )}

        {items.length === 0 ? (
          <Empty />
        ) : filtered.length === 0 ? (
          <Text style={[styles.noMatch, { color: t.inkSoft }]}>Nothing matches “{query}”.</Text>
        ) : (
          sections.map((sec, i) => (
            <View key={sec.title || i}>
              {sec.title ? <SectionLabel>{sec.title}</SectionLabel> : <View style={{ height: 16 }} />}
              {sec.rows.map(({ item, state }) => (
                <ItemCard
                  key={item.id}
                  item={item}
                  state={state}
                  onOpen={() => router.push({ pathname: '/item/[id]', params: { id: item.id } })}
                  onDone={() => actions.logNow(item)}
                  onDoneLongPress={() => actions.logOtherDay(item)}
                  onLongPress={() => actions.menu(item)}
                />
              ))}
            </View>
          ))
        )}

        {items.length > 0 && items.length < 4 && (
          <Text style={[styles.tip, { color: t.inkFaint }]}>
            Tip: tap the circle when you do something. Long-press it to log an earlier day.
          </Text>
        )}
      </ScrollView>

      <View style={[styles.fabWrap, { bottom: insets.bottom + 18 }]} pointerEvents="box-none">
        <Tap
          onPress={() => {
            haptic();
            router.push('/edit');
          }}
          accessibilityRole="button"
          accessibilityLabel="Add something to track"
          style={[styles.fab, { backgroundColor: t.ink }]}
        >
          <Ionicons name="add" size={24} color={t.bg} />
          <Text style={[styles.fabText, { color: t.bg }]}>Track something</Text>
        </Tap>
      </View>
    </View>
  );
}

function Stat({ n, label, color, bg }: { n: number; label: string; color: string; bg: string }) {
  const t = useTheme();
  const active = n > 0;
  return (
    <View style={[styles.stat, { backgroundColor: active ? bg : t.card, borderColor: active ? 'transparent' : t.line }]}>
      <Text style={[styles.statN, { color: active ? color : t.inkFaint }]}>{n}</Text>
      <Text style={[styles.statLabel, { color: active ? color : t.inkFaint }]}>{label}</Text>
    </View>
  );
}

function Empty() {
  const t = useTheme();
  return (
    <View style={[styles.empty, { borderColor: t.line }]}>
      <Text style={styles.emptyEmoji}>🕰️</Text>
      <Text style={[styles.emptyTitle, { color: t.ink }]}>When did you last…?</Text>
      <Text style={[styles.emptyBody, { color: t.inkSoft }]}>
        Change the furnace filter. Call your mom. Get a haircut. Add the things you always lose track of, and tap
        once whenever you do them.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  brand: { fontSize: 17, fontWeight: '800', fontFamily: display, letterSpacing: 0.2 },
  headline: { fontSize: 34, lineHeight: 39, fontWeight: '800', fontFamily: display, letterSpacing: -0.8 },
  stats: { flexDirection: 'row', gap: 8, marginTop: 16 },
  stat: {
    flex: 1,
    borderRadius: radius.md,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderWidth: StyleSheet.hairlineWidth * 2,
  },
  statN: { fontSize: 26, fontWeight: '800', fontFamily: display, fontVariant: ['tabular-nums'] },
  statLabel: { fontSize: 13, fontWeight: '700', marginTop: -2 },
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    height: 44,
    borderRadius: 14,
    paddingHorizontal: 12,
    marginTop: 18,
    borderWidth: StyleSheet.hairlineWidth * 2,
  },
  searchInput: { flex: 1, fontSize: 16, height: '100%' },
  sorts: { marginTop: 14, flexGrow: 0 },
  chip: { paddingHorizontal: 14, height: 34, borderRadius: 17, justifyContent: 'center', borderWidth: 1 },
  chipText: { fontSize: 14, fontWeight: '700', fontFamily: display },
  noMatch: { textAlign: 'center', marginTop: 40, fontSize: 16 },
  tip: { textAlign: 'center', fontSize: 14, marginTop: 14, paddingHorizontal: 24, lineHeight: 20 },
  empty: {
    marginTop: 28,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderRadius: radius.xl,
    padding: 28,
    alignItems: 'center',
  },
  emptyEmoji: { fontSize: 44 },
  emptyTitle: { fontSize: 22, fontWeight: '800', fontFamily: display, marginTop: 10 },
  emptyBody: { fontSize: 16, lineHeight: 23, textAlign: 'center', marginTop: 8 },
  fabWrap: { position: 'absolute', left: 0, right: 0, alignItems: 'center' },
  fab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 56,
    paddingHorizontal: 24,
    borderRadius: 28,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  fabText: { fontSize: 17, fontWeight: '800', fontFamily: display },
});
