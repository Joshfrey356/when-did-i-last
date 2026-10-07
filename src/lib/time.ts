import type { Item } from './types';

export const DAY = 24 * 60 * 60 * 1000;

export function startOfDay(t: number | Date) {
  const d = new Date(t);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

/** Whole calendar days between two instants (local time). */
export function daysBetween(from: number, to: number) {
  return Math.round((startOfDay(to) - startOfDay(from)) / DAY);
}

export function lastLogAt(item: Item): number | null {
  if (!item.logs.length) return null;
  let max = item.logs[0].at;
  for (const l of item.logs) if (l.at > max) max = l.at;
  return max;
}

export function sortedLogs(item: Item) {
  return [...item.logs].sort((a, b) => b.at - a.at);
}

export type Status = 'never' | 'fresh' | 'soon' | 'overdue' | 'tracking';

export interface ItemState {
  last: number | null;
  daysAgo: number | null;
  status: Status;
  /** 0..1+ progress through the interval */
  ratio: number;
  dueAt: number | null;
  /** negative = overdue by N days */
  daysLeft: number | null;
}

export function itemState(item: Item, now = Date.now()): ItemState {
  const last = lastLogAt(item);
  if (last == null) {
    return { last, daysAgo: null, status: 'never', ratio: 0, dueAt: null, daysLeft: null };
  }
  const daysAgo = daysBetween(last, now);
  if (!item.intervalDays) {
    return { last, daysAgo, status: 'tracking', ratio: 0, dueAt: null, daysLeft: null };
  }
  const dueAt = startOfDay(last) + item.intervalDays * DAY;
  const daysLeft = daysBetween(now, dueAt);
  const ratio = daysAgo / item.intervalDays;
  const soonWindow = Math.max(1, Math.round(item.intervalDays * 0.2));
  const status: Status = daysLeft <= 0 ? 'overdue' : daysLeft <= soonWindow ? 'soon' : 'fresh';
  return { last, daysAgo, status, ratio, dueAt, daysLeft };
}

/** "Today", "Yesterday", "12 days ago", "3 months ago", "2 years ago" */
export function agoLabel(daysAgo: number | null) {
  if (daysAgo == null) return 'Never';
  if (daysAgo <= 0) return 'Today';
  if (daysAgo === 1) return 'Yesterday';
  if (daysAgo < 45) return `${daysAgo} days ago`;
  if (daysAgo < 365) {
    const m = Math.round(daysAgo / 30.44);
    return `${m} month${m === 1 ? '' : 's'} ago`;
  }
  const y = Math.floor(daysAgo / 365);
  const rest = Math.round((daysAgo - y * 365) / 30.44);
  return rest >= 1 && y < 3 ? `${y}y ${rest}m ago` : `${y} year${y === 1 ? '' : 's'} ago`;
}

/** Big hero number + unit for the detail screen. */
export function bigAgo(daysAgo: number | null): { value: string; unit: string } {
  if (daysAgo == null) return { value: '—', unit: 'not logged yet' };
  if (daysAgo <= 0) return { value: 'Today', unit: '' };
  if (daysAgo < 365) return { value: String(daysAgo), unit: daysAgo === 1 ? 'day ago' : 'days ago' };
  if (daysAgo < 730) {
    const m = Math.round(daysAgo / 30.44);
    return { value: String(m), unit: 'months ago' };
  }
  return { value: (daysAgo / 365).toFixed(1).replace(/\.0$/, ''), unit: 'years ago' };
}

export function dueLabel(s: ItemState) {
  if (s.daysLeft == null) return null;
  if (s.daysLeft < 0) {
    const n = -s.daysLeft;
    return `${n} day${n === 1 ? '' : 's'} overdue`;
  }
  if (s.daysLeft === 0) return 'Due today';
  if (s.daysLeft === 1) return 'Due tomorrow';
  if (s.daysLeft < 45) return `Due in ${s.daysLeft} days`;
  return `Due ${formatShort(s.dueAt!)}`;
}

/** Shorter variant for list rows. */
export function dueShort(s: ItemState) {
  if (s.daysLeft == null) return null;
  if (s.daysLeft < 0) return `${-s.daysLeft}d overdue`;
  return dueLabel(s);
}

export function intervalLabel(days: number | null | undefined) {
  if (!days) return 'No reminder';
  const preset = INTERVAL_PRESETS.find((p) => p.days === days);
  if (preset) return preset.long;
  if (days % 7 === 0 && days < 70) return `Every ${days / 7} weeks`;
  return `Every ${days} days`;
}

export const INTERVAL_PRESETS = [
  { days: 1, short: 'Daily', long: 'Every day' },
  { days: 3, short: '3 days', long: 'Every 3 days' },
  { days: 7, short: 'Weekly', long: 'Every week' },
  { days: 14, short: '2 weeks', long: 'Every 2 weeks' },
  { days: 30, short: 'Monthly', long: 'Every month' },
  { days: 60, short: '2 months', long: 'Every 2 months' },
  { days: 90, short: '3 months', long: 'Every 3 months' },
  { days: 182, short: '6 months', long: 'Every 6 months' },
  { days: 365, short: 'Yearly', long: 'Every year' },
];

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function formatShort(t: number) {
  const d = new Date(t);
  const sameYear = d.getFullYear() === new Date().getFullYear();
  return `${MONTHS[d.getMonth()]} ${d.getDate()}${sameYear ? '' : `, ${d.getFullYear()}`}`;
}

export function formatLong(t: number) {
  const d = new Date(t);
  return `${WEEKDAYS[d.getDay()]}, ${MONTHS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

export function formatTime(t: number) {
  const d = new Date(t);
  let h = d.getHours();
  const m = d.getMinutes();
  const ap = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return `${h}:${String(m).padStart(2, '0')} ${ap}`;
}

export function formatHour(h: number, m = 0) {
  const ap = h >= 12 ? 'PM' : 'AM';
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${ap}`;
}

export function monthName(i: number) {
  return ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'][i];
}

export interface Insights {
  count: number;
  avgGap: number | null;
  longestGap: number | null;
  shortestGap: number | null;
  gaps: { at: number; days: number }[];
  thisYear: number;
}

export function insights(item: Item): Insights {
  const logs = [...item.logs].sort((a, b) => a.at - b.at);
  const gaps: { at: number; days: number }[] = [];
  for (let i = 1; i < logs.length; i++) {
    gaps.push({ at: logs[i].at, days: Math.max(0, daysBetween(logs[i - 1].at, logs[i].at)) });
  }
  const yr = new Date().getFullYear();
  const thisYear = logs.filter((l) => new Date(l.at).getFullYear() === yr).length;
  if (!gaps.length) {
    return { count: logs.length, avgGap: null, longestGap: null, shortestGap: null, gaps, thisYear };
  }
  const sum = gaps.reduce((s, g) => s + g.days, 0);
  return {
    count: logs.length,
    avgGap: Math.round(sum / gaps.length),
    longestGap: Math.max(...gaps.map((g) => g.days)),
    shortestGap: Math.min(...gaps.map((g) => g.days)),
    gaps,
    thisYear,
  };
}

/** Log at the current time if the chosen day is today, otherwise at noon that day. */
export function timestampForDay(dayStart: number) {
  const today = startOfDay(Date.now());
  if (dayStart === today) return Date.now();
  return dayStart + 12 * 60 * 60 * 1000;
}
