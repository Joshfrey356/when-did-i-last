import Ionicons from '@expo/vector-icons/Ionicons';
import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { display, useTheme } from '../lib/theme';
import { useStore } from '../lib/store';
import { monthName, startOfDay } from '../lib/time';

const DOW = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

export function CalendarPicker({
  value,
  onChange,
  marked,
  color,
}: {
  value: number;
  onChange: (dayStart: number) => void;
  marked?: Set<number>;
  color: string;
}) {
  const t = useTheme();
  const { now } = useStore();
  const today = startOfDay(now);
  const v = new Date(value);
  const [cursor, setCursor] = useState({ y: v.getFullYear(), m: v.getMonth() });

  const cells = useMemo(() => {
    const first = new Date(cursor.y, cursor.m, 1);
    const daysIn = new Date(cursor.y, cursor.m + 1, 0).getDate();
    const out: (number | null)[] = Array(first.getDay()).fill(null);
    for (let d = 1; d <= daysIn; d++) out.push(new Date(cursor.y, cursor.m, d).getTime());
    while (out.length % 7) out.push(null);
    return out;
  }, [cursor]);

  const nowD = new Date(now);
  const atCurrentMonth = cursor.y === nowD.getFullYear() && cursor.m === nowD.getMonth();

  const shift = (n: number) => {
    const d = new Date(cursor.y, cursor.m + n, 1);
    setCursor({ y: d.getFullYear(), m: d.getMonth() });
  };

  return (
    <View>
      <View style={styles.head}>
        <Pressable hitSlop={12} onPress={() => shift(-1)} accessibilityLabel="Previous month" style={styles.nav}>
          <Ionicons name="chevron-back" size={22} color={t.ink} />
        </Pressable>
        <Text style={[styles.month, { color: t.ink }]}>
          {monthName(cursor.m)} {cursor.y}
        </Text>
        <Pressable
          hitSlop={12}
          disabled={atCurrentMonth}
          onPress={() => shift(1)}
          accessibilityLabel="Next month"
          style={[styles.nav, { opacity: atCurrentMonth ? 0.25 : 1 }]}
        >
          <Ionicons name="chevron-forward" size={22} color={t.ink} />
        </Pressable>
      </View>
      <View style={styles.row}>
        {DOW.map((d, i) => (
          <Text key={i} style={[styles.dow, { color: t.inkFaint }]}>
            {d}
          </Text>
        ))}
      </View>
      <View style={styles.grid}>
        {cells.map((c, i) => {
          if (c == null) return <View key={i} style={styles.cell} />;
          const future = c > today;
          const selected = c === startOfDay(value);
          const isToday = c === today;
          const hasLog = marked?.has(c);
          return (
            <Pressable
              key={i}
              disabled={future}
              onPress={() => onChange(c)}
              style={styles.cell}
              accessibilityRole="button"
              accessibilityState={{ selected, disabled: future }}
              accessibilityLabel={new Date(c).toDateString()}
            >
              <View
                style={[
                  styles.day,
                  selected && { backgroundColor: color },
                  !selected && isToday && { borderWidth: 1.5, borderColor: color },
                ]}
              >
                <Text
                  style={[
                    styles.dayText,
                    { color: selected ? '#fff' : future ? t.inkFaint : t.ink },
                    future && { opacity: 0.45 },
                    (selected || isToday) && { fontWeight: '800' },
                  ]}
                >
                  {new Date(c).getDate()}
                </Text>
              </View>
              {hasLog && <View style={[styles.mark, { backgroundColor: selected ? color : t.inkFaint }]} />}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  nav: { padding: 6 },
  month: { fontSize: 18, fontWeight: '800', fontFamily: display },
  row: { flexDirection: 'row' },
  dow: { flex: 1, textAlign: 'center', fontSize: 12, fontWeight: '700', marginBottom: 6 },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: { width: `${100 / 7}%`, height: 46, alignItems: 'center', justifyContent: 'center' },
  day: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  dayText: { fontSize: 16, fontWeight: '600', fontFamily: display },
  mark: { width: 5, height: 5, borderRadius: 3, position: 'absolute', bottom: 1 },
});
