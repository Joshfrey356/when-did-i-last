import type { AccentKey } from './theme';

export interface Template {
  title: string;
  emoji: string;
  color: AccentKey;
  intervalDays: number | null;
}

export const TEMPLATE_GROUPS: { name: string; items: Template[] }[] = [
  {
    name: 'Home',
    items: [
      { title: 'Changed the furnace filter', emoji: '🌬️', color: 'sky', intervalDays: 90 },
      { title: 'Washed the sheets', emoji: '🛏️', color: 'plum', intervalDays: 14 },
      { title: 'Cleaned the fridge', emoji: '🧊', color: 'teal', intervalDays: 30 },
      { title: 'Watered the plants', emoji: '🪴', color: 'sage', intervalDays: 7 },
      { title: 'Tested smoke alarms', emoji: '🚨', color: 'tangerine', intervalDays: 182 },
      { title: 'Deep cleaned the bathroom', emoji: '🛁', color: 'sky', intervalDays: 14 },
      { title: 'Replaced toothbrush head', emoji: '🪥', color: 'teal', intervalDays: 90 },
      { title: 'Cleaned the gutters', emoji: '🍂', color: 'honey', intervalDays: 182 },
    ],
  },
  {
    name: 'Car',
    items: [
      { title: 'Oil change', emoji: '🛢️', color: 'slate', intervalDays: 182 },
      { title: 'Rotated the tires', emoji: '🛞', color: 'slate', intervalDays: 182 },
      { title: 'Washed the car', emoji: '🚗', color: 'sky', intervalDays: 30 },
      { title: 'Checked tire pressure', emoji: '🔧', color: 'honey', intervalDays: 30 },
    ],
  },
  {
    name: 'Health',
    items: [
      { title: 'Dentist cleaning', emoji: '🦷', color: 'teal', intervalDays: 182 },
      { title: 'Haircut', emoji: '💈', color: 'rose', intervalDays: 30 },
      { title: 'Annual physical', emoji: '🩺', color: 'sage', intervalDays: 365 },
      { title: 'Eye exam', emoji: '👓', color: 'plum', intervalDays: 365 },
      { title: 'Went for a run', emoji: '🏃', color: 'tangerine', intervalDays: 3 },
    ],
  },
  {
    name: 'People',
    items: [
      { title: 'Called Mom', emoji: '📞', color: 'rose', intervalDays: 7 },
      { title: 'Date night', emoji: '🍷', color: 'plum', intervalDays: 14 },
      { title: 'Texted my best friend', emoji: '💬', color: 'sky', intervalDays: 14 },
      { title: 'Visited Grandma', emoji: '🫶', color: 'rose', intervalDays: 30 },
    ],
  },
  {
    name: 'Pets',
    items: [
      { title: 'Flea & tick meds', emoji: '🐕', color: 'honey', intervalDays: 30 },
      { title: 'Groomed the dog', emoji: '🛁', color: 'teal', intervalDays: 60 },
      { title: 'Changed the litter', emoji: '🐈', color: 'sage', intervalDays: 7 },
      { title: 'Vet checkup', emoji: '🩺', color: 'sky', intervalDays: 365 },
    ],
  },
  {
    name: 'Me',
    items: [
      { title: 'Backed up my phone', emoji: '💾', color: 'slate', intervalDays: 30 },
      { title: 'Checked my credit report', emoji: '📈', color: 'sage', intervalDays: 182 },
      { title: 'Took a day off', emoji: '🏖️', color: 'honey', intervalDays: 60 },
      { title: 'Read a book', emoji: '📚', color: 'plum', intervalDays: null },
    ],
  },
];

export const EMOJI_CHOICES = [
  '✅', '🌬️', '🛏️', '🧊', '🪴', '🚨', '🛁', '🪥', '🍂', '🧹', '🧺', '🗑️',
  '🛢️', '🛞', '🚗', '🔧', '🚲', '🏍️', '⛽', '🔋',
  '🦷', '💈', '🩺', '👓', '💊', '🏃', '🏋️', '🧘', '💤', '💧',
  '📞', '💬', '🍷', '🫶', '🎁', '👵', '👶', '💌',
  '🐕', '🐈', '🐠', '🐴',
  '💾', '📈', '🏖️', '📚', '✂️', '🎸', '🎮', '🌱', '🔥', '⭐', '🏕️', '✈️',
];
