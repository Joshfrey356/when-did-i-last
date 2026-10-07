import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { DAY, itemState, startOfDay } from './time';
import type { Item, Settings } from './types';

const native = Platform.OS !== 'web';

if (native) {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: false,
      shouldSetBadge: true,
    }),
  });
}

export async function permissionStatus(): Promise<'granted' | 'denied' | 'undetermined'> {
  if (!native) return 'denied';
  const p = await Notifications.getPermissionsAsync();
  if (p.granted) return 'granted';
  return p.canAskAgain ? 'undetermined' : 'denied';
}

/** Ask for permission if we haven't yet. Returns true when notifications are allowed. */
export async function ensurePermission(): Promise<boolean> {
  if (!native) return false;
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  if (!current.canAskAgain) return false;
  const res = await Notifications.requestPermissionsAsync({
    ios: { allowAlert: true, allowBadge: true, allowSound: true },
  });
  return res.granted;
}

const MAX_SCHEDULED = 48; // iOS keeps at most 64 pending

function joinTitles(list: Item[]) {
  const names = list.map((i) => i.title);
  if (names.length <= 2) return names.join(' and ');
  return `${names.slice(0, 2).join(', ')} and ${names.length - 2} more`;
}

/**
 * Rebuilds every pending notification from scratch.
 * One notification per day at most: the first one includes anything already overdue,
 * later ones cover items that become due on that day.
 */
export async function syncReminders(items: Item[], settings: Settings) {
  if (!native) return;
  await Notifications.cancelAllScheduledNotificationsAsync();

  const now = Date.now();
  const tracked = items
    .filter((i) => i.intervalDays && i.logs.length)
    .map((i) => ({ item: i, state: itemState(i, now) }));

  const overdueNow = tracked.filter((t) => t.state.status === 'overdue').length;
  if (settings.badge) await Notifications.setBadgeCountAsync(overdueNow).catch(() => {});
  else await Notifications.setBadgeCountAsync(0).catch(() => {});

  if (!settings.remindersOn) return;
  const perm = await Notifications.getPermissionsAsync();
  if (!perm.granted) return;

  const fireTime = (dayStart: number) =>
    dayStart + settings.reminderHour * 60 * 60 * 1000 + settings.reminderMinute * 60 * 1000;

  let firstDay = startOfDay(now);
  if (fireTime(firstDay) <= now + 60 * 1000) firstDay += DAY;

  // bucket items by the day their reminder fires
  const buckets = new Map<number, Item[]>();
  for (const { item, state } of tracked) {
    if (state.dueAt == null) continue;
    const day = Math.max(startOfDay(state.dueAt), firstDay);
    const list = buckets.get(day) ?? [];
    list.push(item);
    buckets.set(day, list);
  }

  const days = [...buckets.keys()].sort((a, b) => a - b).slice(0, MAX_SCHEDULED);
  let cumulative = 0;
  for (const day of days) {
    const list = buckets.get(day)!;
    cumulative += list.length;
    const single = list.length === 1;
    const it = list[0];
    const overdueDays = single ? Math.round((day - startOfDay(itemState(it, now).dueAt!)) / DAY) : 0;

    const title = single ? `${it.emoji} ${it.title}` : `${list.length} things are due`;
    const body = single
      ? overdueDays > 0
        ? `${overdueDays} day${overdueDays === 1 ? '' : 's'} overdue. Tap "Did it" when it's done.`
        : `It's time again. Last done ${Math.round((day - startOfDay(itemState(it, now).last!)) / DAY)} days ago.`
      : joinTitles(list);

    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        badge: settings.badge ? cumulative : undefined,
        data: single ? { itemId: it.id } : {},
      },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: new Date(fireTime(day)) },
    });
  }
}

export async function sendTestNotification() {
  if (!native) return false;
  const ok = await ensurePermission();
  if (!ok) return false;
  await Notifications.scheduleNotificationAsync({
    content: { title: '🌬️ Changed the furnace filter', body: 'This is what a reminder looks like. Nice work.' },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: 3 },
  });
  return true;
}
