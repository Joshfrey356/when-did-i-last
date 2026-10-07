import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button, Card, IconButton, Pill, ProgressBar, SectionLabel, statusColors } from '../../components/ui';
import { useItem, useStore } from '../../lib/store';
import { accentColor, display, radius, useTheme } from '../../lib/theme';
import {
  agoLabel,
  bigAgo,
  daysBetween,
  dueLabel,
  formatLong,
  formatShort,
  formatTime,
  insights,
  intervalLabel,
  itemState,
  sortedLogs,
} from '../../lib/time';
import { useItemActions } from '../../lib/useActions';

export default function ItemDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const item = useItem(id);
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const { now, updateItem, haptic } = useStore();
  const actions = useItemActions();

  const state = useMemo(() => (item ? itemState(item, now) : null), [item, now]);
  const info = useMemo(() => (item ? insights(item) : null), [item]);
  const history = useMemo(() => (item ? sortedLogs(item) : []), [item]);

  if (!item || !state || !info) {
    return (
      <View style={[styles.missing, { backgroundColor: t.bg, paddingTop: insets.top + 60 }]}>
        <Text style={{ fontSize: 40 }}>🤷</Text>
        <Text style={[styles.missingText, { color: t.inkSoft }]}>This one’s gone.</Text>
        <Button title="Back" kind="secondary" onPress={() => router.back()} style={{ marginTop: 20, alignSelf: 'center' }} />
      </View>
    );
  }

  const a = accentColor(item.color, t);
  const sc = statusColors(state.status, t);
  const big = bigAgo(state.daysAgo);
  const due = dueLabel(state);
  const doneToday = state.daysAgo === 0;

  const suggestion =
    info.avgGap && info.gaps.length >= 2 && info.avgGap >= 1
      ? !item.intervalDays
        ? info.avgGap
        : Math.abs(info.avgGap - item.intervalDays) / item.intervalDays > 0.35
          ? info.avgGap
          : null
      : null;

  const recentGaps = info.gaps.slice(-12);
  const maxGap = Math.max(item.intervalDays ?? 0, ...recentGaps.map((g) => g.days), 1);

  return (
    <View style={{ flex: 1, backgroundColor: t.bg }}>
      <View style={[styles.nav, { paddingTop: insets.top + 6, backgroundColor: t.bg }]}>
        <IconButton icon="chevron-back" label="Back" onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))} />
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <IconButton
            icon="create-outline"
            label="Edit"
            onPress={() => router.push({ pathname: '/edit', params: { id: item.id } })}
          />
          <IconButton icon="trash-outline" label="Delete" tint={t.overdue} onPress={() => actions.remove(item, () => router.back())} />
        </View>
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: insets.bottom + 40 }}>
        <View style={styles.hero}>
          <View style={[styles.tile, { backgroundColor: a.soft }]}>
            <Text style={styles.tileEmoji}>{item.emoji}</Text>
          </View>
          <Text style={[styles.title, { color: t.ink }]}>{item.title}</Text>

          <View style={styles.bigRow}>
            <Text style={[styles.bigNum, { color: t.ink }]}>{big.value}</Text>
            {big.unit ? <Text style={[styles.bigUnit, { color: t.inkSoft }]}>{big.unit}</Text> : null}
          </View>

          <View style={styles.pills}>
            {due && (
              <Pill
                text={due}
                status={state.status}
                icon={state.status === 'overdue' ? 'alert-circle' : state.status === 'soon' ? 'time' : 'checkmark-circle'}
              />
            )}
            <Pill text={intervalLabel(item.intervalDays)} status="tracking" icon={item.intervalDays ? 'repeat' : 'eye-outline'} />
          </View>

          {state.last && (
            <Text style={[styles.lastLine, { color: t.inkSoft }]}>
              Last done {formatLong(state.last)}
            </Text>
          )}
        </View>

        {item.intervalDays && state.last && state.dueAt ? (
          <View style={styles.progress}>
            <ProgressBar ratio={state.ratio} color={sc.fg} track={t.track} height={10} />
            <View style={styles.progressLabels}>
              <Text style={[styles.progressLabel, { color: t.inkFaint }]}>{formatShort(state.last)}</Text>
              <Text style={[styles.progressLabel, { color: t.inkFaint }]}>Due {formatShort(state.dueAt)}</Text>
            </View>
          </View>
        ) : null}

        <View style={styles.actions}>
          <Button
            title={doneToday ? 'Done today ✓' : 'Did it today'}
            icon={doneToday ? undefined : 'checkmark'}
            color={a.main}
            onPress={() => actions.logNow(item)}
            style={{ flex: 1 }}
          />
          <Button title="Earlier day" kind="secondary" icon="calendar-outline" onPress={() => actions.logOtherDay(item)} />
        </View>

        {suggestion ? (
          <Pressable
            onPress={() => {
              haptic('success');
              updateItem(item.id, { intervalDays: suggestion });
            }}
            style={({ pressed }) => [
              styles.suggest,
              { backgroundColor: a.soft, opacity: pressed ? 0.8 : 1 },
            ]}
          >
            <Ionicons name="sparkles" size={20} color={a.main} />
            <Text style={[styles.suggestText, { color: t.ink }]}>
              You usually do this about every <Text style={{ fontWeight: '800' }}>{suggestion} days</Text>.{' '}
              <Text style={{ color: a.main, fontWeight: '800' }}>
                {item.intervalDays ? 'Update reminder' : 'Set as reminder'}
              </Text>
            </Text>
          </Pressable>
        ) : null}

        {info.count > 0 && (
          <>
            <SectionLabel>Insights</SectionLabel>
            <View style={styles.grid}>
              <Metric label="Times logged" value={String(info.count)} />
              <Metric label="This year" value={String(info.thisYear)} />
              <Metric label="Usually every" value={info.avgGap != null ? `${info.avgGap}d` : '—'} />
              <Metric label="Longest gap" value={info.longestGap != null ? `${info.longestGap}d` : '—'} />
            </View>
          </>
        )}

        {recentGaps.length >= 2 && (
          <Card style={{ marginTop: 10 }}>
            <Text style={[styles.chartTitle, { color: t.ink }]}>Days between each time</Text>
            <View style={styles.chart}>
              {item.intervalDays ? (
                <View
                  style={[
                    styles.goalLine,
                    { bottom: (item.intervalDays / maxGap) * 110, borderColor: t.inkFaint },
                  ]}
                />
              ) : null}
              {recentGaps.map((g, i) => {
                const over = item.intervalDays ? g.days > item.intervalDays : false;
                return (
                  <View key={i} style={styles.barCol}>
                    <Text style={[styles.barVal, { color: t.inkSoft }]}>{g.days}</Text>
                    <View
                      style={{
                        height: Math.max(4, (g.days / maxGap) * 110),
                        width: '70%',
                        maxWidth: 26,
                        borderRadius: 6,
                        backgroundColor: over ? t.overdue : a.main,
                        opacity: i === recentGaps.length - 1 ? 1 : 0.55,
                      }}
                    />
                  </View>
                );
              })}
            </View>
            {item.intervalDays ? (
              <Text style={[styles.chartNote, { color: t.inkFaint }]}>Dashed line is your {item.intervalDays}-day goal</Text>
            ) : null}
          </Card>
        )}

        {item.notes ? (
          <>
            <SectionLabel>Notes</SectionLabel>
            <Card>
              <Text style={[styles.notes, { color: t.ink }]}>{item.notes}</Text>
            </Card>
          </>
        ) : null}

        <SectionLabel>{`History${history.length ? ` · ${history.length}` : ''}`}</SectionLabel>
        {history.length === 0 ? (
          <Card>
            <Text style={[styles.emptyHist, { color: t.inkSoft }]}>
              Nothing logged yet. Tap “Did it today” the next time you do it, or “Earlier day” if you remember when you
              last did.
            </Text>
          </Card>
        ) : (
          <View style={[styles.historyCard, { backgroundColor: t.card, borderColor: t.line }]}>
            {history.map((l, i) => {
              const prev = history[i + 1];
              const gap = prev ? daysBetween(prev.at, l.at) : null;
              return (
                <Pressable
                  key={l.id}
                  onPress={() => router.push({ pathname: '/log', params: { id: item.id, logId: l.id } })}
                  style={({ pressed }) => [
                    styles.histRow,
                    i < history.length - 1 && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: t.line },
                    pressed && { backgroundColor: t.cardPressed },
                  ]}
                >
                  <View style={[styles.histDot, { backgroundColor: i === 0 ? a.main : t.track }]} />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.histDate, { color: t.ink }]}>{formatLong(l.at)}</Text>
                    <Text style={[styles.histMeta, { color: t.inkSoft }]}>
                      {agoLabel(daysBetween(l.at, now))}
                      {daysBetween(l.at, now) === 0 ? ` at ${formatTime(l.at)}` : ''}
                      {gap != null ? ` · ${gap}-day gap` : ''}
                    </Text>
                    {l.note ? <Text style={[styles.histNote, { color: t.ink }]}>“{l.note}”</Text> : null}
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={t.inkFaint} />
                </Pressable>
              );
            })}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  const t = useTheme();
  return (
    <View style={[styles.metric, { backgroundColor: t.card, borderColor: t.line }]}>
      <Text style={[styles.metricVal, { color: t.ink }]}>{value}</Text>
      <Text style={[styles.metricLabel, { color: t.inkSoft }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  missing: { flex: 1, alignItems: 'center' },
  missingText: { fontSize: 18, marginTop: 10 },
  nav: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 16, paddingBottom: 6 },
  hero: { alignItems: 'center', marginTop: 10 },
  tile: { width: 84, height: 84, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
  tileEmoji: { fontSize: 44 },
  title: {
    fontSize: 26,
    lineHeight: 31,
    fontWeight: '800',
    fontFamily: display,
    textAlign: 'center',
    marginTop: 14,
    letterSpacing: -0.5,
  },
  bigRow: { flexDirection: 'row', alignItems: 'baseline', gap: 8, marginTop: 10 },
  bigNum: { fontSize: 72, lineHeight: 80, fontWeight: '900', fontFamily: display, letterSpacing: -2, fontVariant: ['tabular-nums'] },
  bigUnit: { fontSize: 20, fontWeight: '700', fontFamily: display },
  pills: { flexDirection: 'row', gap: 8, marginTop: 6, flexWrap: 'wrap', justifyContent: 'center' },
  lastLine: { fontSize: 15, marginTop: 12 },
  progress: { marginTop: 22 },
  progressLabels: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 7 },
  progressLabel: { fontSize: 13, fontWeight: '600' },
  actions: { flexDirection: 'row', gap: 10, marginTop: 22 },
  suggest: { flexDirection: 'row', gap: 10, alignItems: 'center', padding: 14, borderRadius: radius.md, marginTop: 14 },
  suggestText: { flex: 1, fontSize: 15, lineHeight: 21 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  metric: {
    width: '48%',
    flexGrow: 1,
    borderRadius: radius.md,
    padding: 14,
    borderWidth: StyleSheet.hairlineWidth * 2,
  },
  metricVal: { fontSize: 26, fontWeight: '800', fontFamily: display, fontVariant: ['tabular-nums'] },
  metricLabel: { fontSize: 13, fontWeight: '600', marginTop: 2 },
  chartTitle: { fontSize: 15, fontWeight: '700', fontFamily: display },
  chart: { height: 150, flexDirection: 'row', alignItems: 'flex-end', marginTop: 10 },
  barCol: { flex: 1, alignItems: 'center', justifyContent: 'flex-end', gap: 4 },
  barVal: { fontSize: 11, fontWeight: '700' },
  goalLine: { position: 'absolute', left: 0, right: 0, borderTopWidth: 1.5, borderStyle: 'dashed' },
  chartNote: { fontSize: 12, marginTop: 8 },
  notes: { fontSize: 16, lineHeight: 23 },
  emptyHist: { fontSize: 15, lineHeight: 22 },
  historyCard: { borderRadius: radius.lg, borderWidth: StyleSheet.hairlineWidth * 2, overflow: 'hidden' },
  histRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 13, paddingHorizontal: 14 },
  histDot: { width: 10, height: 10, borderRadius: 5 },
  histDate: { fontSize: 16, fontWeight: '700', fontFamily: display },
  histMeta: { fontSize: 13, marginTop: 2 },
  histNote: { fontSize: 14, marginTop: 4, fontStyle: 'italic' },
});
