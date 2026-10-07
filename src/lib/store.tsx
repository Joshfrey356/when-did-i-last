import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { AppState, Platform } from 'react-native';
import { demoData } from './demo';
import { syncReminders } from './reminders';
import { DEFAULT_SETTINGS, type AppData, type Item, type LogEntry, type Settings } from './types';

const KEY = 'lasttime:data:v1';

export const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);

type NewItem = Omit<Item, 'id' | 'createdAt' | 'logs'> & { logs?: LogEntry[] };

interface Store {
  ready: boolean;
  items: Item[];
  settings: Settings;
  /** Bumps when the app returns to foreground / day rolls over so "ago" labels refresh. */
  now: number;
  addItem: (i: NewItem) => string;
  addItems: (list: NewItem[]) => void;
  updateItem: (id: string, patch: Partial<Item>) => void;
  deleteItem: (id: string) => Item | undefined;
  restoreItem: (item: Item) => void;
  log: (id: string, at?: number, note?: string) => string;
  updateLog: (itemId: string, logId: string, patch: Partial<LogEntry>) => void;
  deleteLog: (itemId: string, logId: string) => void;
  updateSettings: (patch: Partial<Settings>) => void;
  replaceAll: (data: AppData) => void;
  exportData: () => AppData;
  resetAll: () => void;
  haptic: (kind?: 'light' | 'success' | 'warning' | 'select') => void;
}

const Ctx = createContext<Store | null>(null);

function isDemo() {
  if (Platform.OS !== 'web' || typeof window === 'undefined') return false;
  return new URLSearchParams(window.location.search).has('demo');
}

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [items, setItems] = useState<Item[]>([]);
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [now, setNow] = useState(() => Date.now());
  const loaded = useRef(false);
  const itemsRef = useRef(items);
  useEffect(() => {
    itemsRef.current = items;
  }, [items]);
  const settingsRef = useRef(settings);
  useEffect(() => {
    settingsRef.current = settings;
  }, [settings]);

  // Load
  useEffect(() => {
    (async () => {
      try {
        if (isDemo()) {
          const d = demoData();
          setItems(d.items);
          setSettings(d.settings);
        } else {
          const raw = await AsyncStorage.getItem(KEY);
          if (raw) {
            const data = JSON.parse(raw) as Partial<AppData>;
            setItems(Array.isArray(data.items) ? data.items : []);
            setSettings({ ...DEFAULT_SETTINGS, ...(data.settings ?? {}) });
          }
        }
      } catch (e) {
        console.warn('Failed to load data', e);
      } finally {
        loaded.current = true;
        setReady(true);
      }
    })();
  }, []);

  // Persist + resync reminders whenever data changes
  useEffect(() => {
    if (!loaded.current || isDemo()) return;
    const data: AppData = { version: 1, items, settings };
    AsyncStorage.setItem(KEY, JSON.stringify(data)).catch((e) => console.warn('save failed', e));
    const t = setTimeout(() => {
      syncReminders(items, settings).catch((e) => console.warn('reminders failed', e));
    }, 400);
    return () => clearTimeout(t);
  }, [items, settings]);

  // Refresh "now" when foregrounded and every few minutes (handles midnight rollover)
  useEffect(() => {
    const sub = AppState.addEventListener('change', (s) => {
      if (s !== 'active') return;
      setNow(Date.now());
      // Overdue nudges are one-shot, so rebuild the schedule (and badge) each time the app opens.
      if (loaded.current && !isDemo()) {
        syncReminders(itemsRef.current, settingsRef.current).catch(() => {});
      }
    });
    const iv = setInterval(() => setNow(Date.now()), 5 * 60 * 1000);
    return () => {
      sub.remove();
      clearInterval(iv);
    };
  }, []);

  const hapticsOn = settings.haptics;
  const haptic = useCallback(
    (kind: 'light' | 'success' | 'warning' | 'select' = 'light') => {
      if (!hapticsOn || Platform.OS === 'web') return;
      if (kind === 'success') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      else if (kind === 'warning') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      else if (kind === 'select') Haptics.selectionAsync();
      else Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    },
    [hapticsOn],
  );

  const addItem = useCallback((i: NewItem) => {
    const id = uid();
    setItems((prev) => [{ ...i, logs: i.logs ?? [], id, createdAt: Date.now() }, ...prev]);
    return id;
  }, []);

  const addItems = useCallback((list: NewItem[]) => {
    const t = Date.now();
    setItems((prev) => [
      ...list.map((i, n) => ({ ...i, logs: i.logs ?? [], id: uid() + n, createdAt: t + n })),
      ...prev,
    ]);
  }, []);

  const updateItem = useCallback((id: string, patch: Partial<Item>) => {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, ...patch } : i)));
  }, []);


  const deleteItem = useCallback((id: string) => {
    const found = itemsRef.current.find((i) => i.id === id);
    setItems((prev) => prev.filter((i) => i.id !== id));
    return found;
  }, []);

  const restoreItem = useCallback((item: Item) => {
    setItems((prev) => (prev.some((i) => i.id === item.id) ? prev : [item, ...prev]));
  }, []);

  const log = useCallback((id: string, at = Date.now(), note?: string) => {
    const logId = uid();
    const entry: LogEntry = note ? { id: logId, at, note } : { id: logId, at };
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, logs: [...i.logs, entry] } : i)));
    setNow(Date.now());
    return logId;
  }, []);

  const updateLog = useCallback((itemId: string, logId: string, patch: Partial<LogEntry>) => {
    setItems((prev) =>
      prev.map((i) =>
        i.id === itemId ? { ...i, logs: i.logs.map((l) => (l.id === logId ? { ...l, ...patch } : l)) } : i,
      ),
    );
  }, []);

  const deleteLog = useCallback((itemId: string, logId: string) => {
    setItems((prev) =>
      prev.map((i) => (i.id === itemId ? { ...i, logs: i.logs.filter((l) => l.id !== logId) } : i)),
    );
  }, []);

  const updateSettings = useCallback((patch: Partial<Settings>) => {
    setSettings((s) => ({ ...s, ...patch }));
  }, []);

  const replaceAll = useCallback((data: AppData) => {
    setItems(data.items);
    setSettings({ ...DEFAULT_SETTINGS, ...data.settings, onboarded: true });
  }, []);

  const exportData = useCallback(
    (): AppData => ({ version: 1, items: itemsRef.current, settings: settingsRef.current }),
    [],
  );

  const resetAll = useCallback(() => {
    setItems([]);
    setSettings(DEFAULT_SETTINGS);
  }, []);

  const value = useMemo<Store>(
    () => ({
      ready,
      items,
      settings,
      now,
      addItem,
      addItems,
      updateItem,
      deleteItem,
      restoreItem,
      log,
      updateLog,
      deleteLog,
      updateSettings,
      replaceAll,
      exportData,
      resetAll,
      haptic,
    }),
    [ready, items, settings, now, addItem, addItems, updateItem, deleteItem, restoreItem, log, updateLog, deleteLog, updateSettings, replaceAll, exportData, resetAll, haptic],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStore() {
  const s = useContext(Ctx);
  if (!s) throw new Error('useStore outside provider');
  return s;
}

export function useItem(id: string | undefined) {
  const { items } = useStore();
  return items.find((i) => i.id === id);
}

/** Validate an imported backup file. Throws with a friendly message if invalid. */
export function parseBackup(text: string): AppData {
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error("That file isn't a Last Time backup.");
  }
  const d = data as Partial<AppData>;
  if (!d || !Array.isArray(d.items)) throw new Error("That file isn't a Last Time backup.");
  const items: Item[] = d.items
    .filter((i) => i && typeof i.title === 'string')
    .map((i) => ({
      id: String(i.id ?? uid()),
      title: i.title,
      emoji: typeof i.emoji === 'string' ? i.emoji : '✅',
      color: i.color ?? 'tangerine',
      intervalDays: typeof i.intervalDays === 'number' && i.intervalDays > 0 ? i.intervalDays : null,
      notes: i.notes,
      createdAt: typeof i.createdAt === 'number' ? i.createdAt : Date.now(),
      logs: Array.isArray(i.logs)
        ? i.logs.filter((l) => l && typeof l.at === 'number').map((l) => ({ id: String(l.id ?? uid()), at: l.at, note: l.note }))
        : [],
    }));
  return { version: 1, items, settings: { ...DEFAULT_SETTINGS, ...(d.settings ?? {}) } };
}
