import type { AccentKey } from './theme';

export interface LogEntry {
  id: string;
  at: number;
  note?: string;
}

export interface Item {
  id: string;
  title: string;
  emoji: string;
  color: AccentKey;
  /** Remind when this many days have passed since the last log. null = just track. */
  intervalDays: number | null;
  notes?: string;
  createdAt: number;
  logs: LogEntry[];
}

export type SortMode = 'due' | 'recent' | 'oldest' | 'az';

export interface Settings {
  onboarded: boolean;
  remindersOn: boolean;
  reminderHour: number;
  reminderMinute: number;
  sort: SortMode;
  haptics: boolean;
  badge: boolean;
}

export interface AppData {
  version: 1;
  items: Item[];
  settings: Settings;
}

export const DEFAULT_SETTINGS: Settings = {
  onboarded: false,
  remindersOn: true,
  reminderHour: 9,
  reminderMinute: 0,
  sort: 'due',
  haptics: true,
  badge: true,
};
