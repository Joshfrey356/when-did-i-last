import Ionicons from '@expo/vector-icons/Ionicons';
import React from 'react';
import { Pressable, StyleSheet, Switch, Text, View, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';
import { display, radius, useTheme } from '../lib/theme';
import type { Status } from '../lib/time';

export type IconName = React.ComponentProps<typeof Ionicons>['name'];

/** Pressable that gently shrinks while pressed. */
export function Tap({
  style,
  scale = 0.97,
  children,
  ...rest
}: Omit<PressableProps, 'style'> & { style?: StyleProp<ViewStyle>; scale?: number; children: React.ReactNode }) {
  return (
    <Pressable {...rest} style={({ pressed }) => [style, pressed && { transform: [{ scale }], opacity: 0.92 }]}>
      {children}
    </Pressable>
  );
}

export function IconButton({
  icon,
  onPress,
  label,
  tint,
  bg,
  size = 40,
}: {
  icon: IconName;
  onPress: () => void;
  label: string;
  tint?: string;
  bg?: string;
  size?: number;
}) {
  const t = useTheme();
  return (
    <Tap
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={8}
      scale={0.9}
      style={[
        styles.iconBtn,
        { width: size, height: size, borderRadius: size / 2, backgroundColor: bg ?? t.card, borderColor: t.line },
      ]}
    >
      <Ionicons name={icon} size={size * 0.5} color={tint ?? t.ink} />
    </Tap>
  );
}

export function Button({
  title,
  onPress,
  icon,
  kind = 'primary',
  disabled,
  style,
  color,
}: {
  title: string;
  onPress: () => void;
  icon?: IconName;
  kind?: 'primary' | 'secondary' | 'danger' | 'ghost';
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  color?: string;
}) {
  const t = useTheme();
  const accent = color ?? t.accent;
  const bg =
    kind === 'primary' ? accent : kind === 'secondary' ? t.card : kind === 'danger' ? t.overdueSoft : 'transparent';
  const fg = kind === 'primary' ? t.onAccent : kind === 'danger' ? t.overdue : kind === 'ghost' ? t.inkSoft : t.ink;
  return (
    <Tap
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      style={[
        styles.btn,
        { backgroundColor: bg, opacity: disabled ? 0.45 : 1 },
        kind === 'secondary' && { borderWidth: StyleSheet.hairlineWidth * 2, borderColor: t.line },
        style,
      ]}
    >
      {icon && <Ionicons name={icon} size={19} color={fg} />}
      <Text style={[styles.btnText, { color: fg }]} numberOfLines={1}>
        {title}
      </Text>
    </Tap>
  );
}

export function Toggle({ value, onChange, label }: { value: boolean; onChange: (v: boolean) => void; label: string }) {
  const t = useTheme();
  // activeThumbColor / activeTrackColor are react-native-web props; native ignores them.
  const webProps = { activeThumbColor: '#fff', activeTrackColor: t.accent } as object;
  return (
    <Switch
      value={value}
      onValueChange={onChange}
      accessibilityLabel={label}
      trackColor={{ true: t.accent, false: t.track }}
      thumbColor="#fff"
      ios_backgroundColor={t.track}
      {...webProps}
    />
  );
}

export function SectionLabel({ children, right }: { children: string; right?: React.ReactNode }) {
  const t = useTheme();
  return (
    <View style={styles.sectionRow}>
      <Text style={[styles.section, { color: t.inkSoft }]}>{children.toUpperCase()}</Text>
      {right}
    </View>
  );
}

export function statusColors(status: Status, t: ReturnType<typeof useTheme>) {
  switch (status) {
    case 'overdue':
      return { fg: t.overdue, bg: t.overdueSoft };
    case 'soon':
      return { fg: t.soon, bg: t.soonSoft };
    case 'fresh':
      return { fg: t.fresh, bg: t.freshSoft };
    default:
      return { fg: t.inkSoft, bg: t.track };
  }
}

export function Pill({ text, status, icon }: { text: string; status: Status; icon?: IconName }) {
  const t = useTheme();
  const c = statusColors(status, t);
  return (
    <View style={[styles.pill, { backgroundColor: c.bg }]}>
      {icon && <Ionicons name={icon} size={13} color={c.fg} />}
      <Text style={[styles.pillText, { color: c.fg }]}>{text}</Text>
    </View>
  );
}

export function ProgressBar({ ratio, color, track, height = 5 }: { ratio: number; color: string; track: string; height?: number }) {
  const pct = Math.max(0.03, Math.min(1, ratio));
  return (
    <View style={{ height, borderRadius: height, backgroundColor: track, overflow: 'hidden' }}>
      <View style={{ width: `${pct * 100}%`, height: '100%', borderRadius: height, backgroundColor: color }} />
    </View>
  );
}

export function Card({ children, style }: { children: React.ReactNode; style?: StyleProp<ViewStyle> }) {
  const t = useTheme();
  return <View style={[styles.card, { backgroundColor: t.card, borderColor: t.line }, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  iconBtn: { alignItems: 'center', justifyContent: 'center', borderWidth: StyleSheet.hairlineWidth * 2 },
  btn: {
    height: 54,
    borderRadius: radius.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 20,
  },
  btnText: { fontSize: 17, fontWeight: '700', fontFamily: display },
  sectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 26,
    marginBottom: 10,
    paddingHorizontal: 4,
  },
  section: { fontSize: 13, fontWeight: '700', letterSpacing: 0.8 },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    alignSelf: 'flex-start',
  },
  pillText: { fontSize: 13, fontWeight: '700', fontFamily: display },
  card: { borderRadius: radius.lg, borderWidth: StyleSheet.hairlineWidth * 2, padding: 16 },
});
