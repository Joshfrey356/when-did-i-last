import Ionicons from '@expo/vector-icons/Ionicons';
import React, { useState } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { accentColor, display, radius, useTheme } from '../lib/theme';
import { agoLabel, dueShort, intervalLabel, type ItemState } from '../lib/time';
import type { Item } from '../lib/types';
import { ProgressBar, statusColors } from './ui';

export function ItemCard({
  item,
  state,
  onOpen,
  onDone,
  onLongPress,
  onDoneLongPress,
}: {
  item: Item;
  state: ItemState;
  onOpen: () => void;
  onDone: () => void;
  onLongPress?: () => void;
  onDoneLongPress?: () => void;
}) {
  const t = useTheme();
  const a = accentColor(item.color, t);
  const sc = statusColors(state.status, t);
  const [pop] = useState(() => new Animated.Value(1));
  const doneToday = state.daysAgo === 0;

  const press = () => {
    Animated.sequence([
      Animated.spring(pop, { toValue: 1.22, useNativeDriver: true, speed: 40, bounciness: 14 }),
      Animated.spring(pop, { toValue: 1, useNativeDriver: true, speed: 20, bounciness: 10 }),
    ]).start();
    onDone();
  };

  const due = dueShort(state);
  const sub =
    state.status === 'never'
      ? item.intervalDays
        ? `${intervalLabel(item.intervalDays)} · not logged yet`
        : 'Not logged yet'
      : due ?? 'Just tracking';

  return (
    <Pressable
      onPress={onOpen}
      onLongPress={onLongPress}
      delayLongPress={350}
      accessibilityRole="button"
      accessibilityLabel={`${item.title}. ${agoLabel(state.daysAgo)}. ${sub}`}
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: pressed ? t.cardPressed : t.card, borderColor: t.line },
        state.status === 'overdue' && { borderColor: t.isDark ? '#5A2A20' : '#F3C9BD' },
      ]}
    >
      <View style={[styles.tile, { backgroundColor: a.soft }]}>
        <Text style={styles.emoji}>{item.emoji}</Text>
      </View>

      <View style={styles.mid}>
        <Text style={[styles.title, { color: t.ink }]} numberOfLines={1}>
          {item.title}
        </Text>
        <View style={styles.metaRow}>
          <Text style={[styles.ago, { color: t.ink }]} numberOfLines={1}>
            {agoLabel(state.daysAgo)}
          </Text>
          <Text style={[styles.dot, { color: t.inkFaint }]}>·</Text>
          <Text
            style={[styles.due, { color: state.status === 'tracking' || state.status === 'never' ? t.inkSoft : sc.fg }]}
            numberOfLines={1}
          >
            {sub}
          </Text>
        </View>
        {item.intervalDays && state.status !== 'never' ? (
          <View style={styles.bar}>
            <ProgressBar ratio={state.ratio} color={sc.fg} track={t.track} height={4} />
          </View>
        ) : null}
      </View>

      <Pressable
        onPress={press}
        onLongPress={onDoneLongPress}
        delayLongPress={350}
        hitSlop={10}
        accessibilityRole="button"
        accessibilityLabel={`Mark ${item.title} done today`}
        accessibilityHint="Long press to pick a different day"
      >
        {({ pressed }) => (
          <Animated.View
            style={[
              styles.check,
              doneToday
                ? { backgroundColor: a.main, borderColor: a.main }
                : { backgroundColor: pressed ? a.soft : 'transparent', borderColor: t.isDark ? t.inkFaint : '#D9D0C2' },
              { transform: [{ scale: pop }] },
            ]}
          >
            <Ionicons name="checkmark" size={24} color={doneToday ? '#fff' : a.main} />
          </Animated.View>
        )}
      </Pressable>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 14,
    paddingLeft: 14,
    paddingRight: 16,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth * 2,
    marginBottom: 10,
  },
  tile: { width: 50, height: 50, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  emoji: { fontSize: 26 },
  mid: { flex: 1, minWidth: 0 },
  title: { fontSize: 17, fontWeight: '700', fontFamily: display, letterSpacing: -0.2 },
  metaRow: { flexDirection: 'row', alignItems: 'center', marginTop: 3 },
  ago: { fontSize: 14, fontWeight: '600', flexShrink: 0 },
  dot: { marginHorizontal: 6, fontSize: 14 },
  due: { fontSize: 14, fontWeight: '600', flexShrink: 1 },
  bar: { marginTop: 9 },
  check: {
    width: 46,
    height: 46,
    borderRadius: 23,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
