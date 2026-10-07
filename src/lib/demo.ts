import { DAY } from './time';
import { DEFAULT_SETTINGS, type AppData, type Item } from './types';
import type { AccentKey } from './theme';

/** Sample data used only for web previews (?demo) and App Store screenshots. */
export function demoData(): AppData {
  const now = Date.now();
  const mk = (
    id: string,
    title: string,
    emoji: string,
    color: AccentKey,
    intervalDays: number | null,
    agoDays: number[],
    notes?: Record<number, string>,
  ): Item => ({
    id,
    title,
    emoji,
    color,
    intervalDays,
    createdAt: now - 400 * DAY,
    logs: agoDays.map((d, n) => ({
      id: `${id}-${n}`,
      at: now - d * DAY - (d === 0 ? 0 : 3 * 60 * 60 * 1000),
      ...(notes?.[d] ? { note: notes[d] } : {}),
    })),
  });

  return {
    version: 1,
    settings: { ...DEFAULT_SETTINGS, onboarded: true },
    items: [
      mk('filter', 'Changed the furnace filter', '🌬️', 'sky', 90, [104, 196, 281, 370], {
        104: '20x25x1 MERV 11 from Home Depot',
      }),
      mk('mom', 'Called Mom', '📞', 'rose', 7, [6, 13, 19, 27, 33, 41]),
      mk('oil', 'Oil change', '🛢️', 'slate', 182, [61, 240], { 61: 'Jiffy Lube, 48,210 mi' }),
      mk('sheets', 'Washed the sheets', '🛏️', 'plum', 14, [12, 27, 40, 55]),
      mk('plants', 'Watered the plants', '🪴', 'sage', 7, [0, 6, 13, 21, 27]),
      mk('haircut', 'Haircut', '💈', 'tangerine', 30, [24, 55, 88, 116]),
      mk('dentist', 'Dentist cleaning', '🦷', 'teal', 182, [143, 330]),
      mk('smoke', 'Tested smoke alarms', '🚨', 'honey', 182, [210]),
      mk('dog', 'Flea & tick meds', '🐕', 'honey', 30, [2, 31, 60, 92]),
      mk('book', 'Finished a book', '📚', 'plum', null, [19, 64, 101]),
    ],
  };
}
