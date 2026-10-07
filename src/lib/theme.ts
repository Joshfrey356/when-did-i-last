import { Platform, useColorScheme } from 'react-native';

export const ACCENTS = {
  tangerine: { light: '#F2643A', dark: '#FF7A52', soft: '#FDE3D9', softDark: '#3A2219' },
  sage: { light: '#4F8A62', dark: '#6FB386', soft: '#DCEBDF', softDark: '#1C2E22' },
  sky: { light: '#3D7BC4', dark: '#6CA3E6', soft: '#DAE7F6', softDark: '#18263A' },
  plum: { light: '#8A5BB8', dark: '#B48BE0', soft: '#EBE1F5', softDark: '#2B2138' },
  honey: { light: '#C98A12', dark: '#E8AE3E', soft: '#F8EBCD', softDark: '#33280F' },
  rose: { light: '#D0507A', dark: '#F07AA0', soft: '#F8DEE7', softDark: '#3A1A26' },
  teal: { light: '#23877E', dark: '#4DBCB0', soft: '#D5ECE9', softDark: '#132E2B' },
  slate: { light: '#5D6573', dark: '#9AA3B2', soft: '#E3E5E9', softDark: '#23262C' },
} as const;

export type AccentKey = keyof typeof ACCENTS;
export const ACCENT_KEYS = Object.keys(ACCENTS) as AccentKey[];

const light = {
  bg: '#F6F1E9',
  card: '#FFFDF9',
  cardPressed: '#F1EBE1',
  ink: '#1B1814',
  inkSoft: '#6B645A',
  inkFaint: '#A39B8F',
  line: '#E8E0D3',
  track: '#EDE6DA',
  accent: '#F2643A',
  onAccent: '#FFFFFF',
  fresh: '#4F8A62',
  soon: '#D08A0E',
  overdue: '#E0482B',
  freshSoft: '#E3EFE5',
  soonSoft: '#FAEDD3',
  overdueSoft: '#FBE1DA',
  sheet: '#FFFDF9',
  scrim: 'rgba(27,24,20,0.35)',
  toast: '#1B1814',
  onToast: '#FFFDF9',
};

const dark: typeof light = {
  bg: '#15130F',
  card: '#211E19',
  cardPressed: '#2A2620',
  ink: '#F4EEE4',
  inkSoft: '#B3AA9C',
  inkFaint: '#7A7266',
  line: '#322D26',
  track: '#2E2A23',
  accent: '#FF7A52',
  onAccent: '#1B1814',
  fresh: '#6FB386',
  soon: '#E8AE3E',
  overdue: '#FF6A4D',
  freshSoft: '#1C2E22',
  soonSoft: '#33280F',
  overdueSoft: '#3A1D16',
  sheet: '#211E19',
  scrim: 'rgba(0,0,0,0.55)',
  toast: '#F4EEE4',
  onToast: '#15130F',
};

export type Theme = typeof light & { isDark: boolean };

export function useTheme(): Theme {
  const scheme = useColorScheme();
  return scheme === 'dark' ? { ...dark, isDark: true } : { ...light, isDark: false };
}

export function accentColor(key: AccentKey, t: Theme) {
  const a = ACCENTS[key] ?? ACCENTS.tangerine;
  return { main: t.isDark ? a.dark : a.light, soft: t.isDark ? a.softDark : a.soft };
}

/** Rounded system face on iOS (SF Pro Rounded); falls back gracefully elsewhere. */
export const display = Platform.select({
  ios: 'ui-rounded',
  web: 'ui-rounded, "SF Pro Rounded", "Nunito", system-ui, -apple-system, sans-serif',
  default: undefined,
});

export const radius = { sm: 10, md: 16, lg: 22, xl: 28 };
