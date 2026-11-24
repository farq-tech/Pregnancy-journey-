import { t, type StringKey } from '../i18n';
import type { IsoDate } from '../lib/dates';

export type AppointmentType =
  | 'doctor'
  | 'ultrasound'
  | 'blood'
  | 'genetic'
  | 'lab'
  | 'hospital'
  | 'vaccine'
  | 'other';

export type ReminderOffset = '' | '1h' | '24h' | '48h' | 'week';

export type RecordType =
  | 'blood'
  | 'ultrasound'
  | 'report'
  | 'lab'
  | 'rx'
  | 'photo'
  | 'note';

/** Repeat rule for follow-up visits; empty means a one-off. */
export type Recurrence = '' | 'weekly' | 'biweekly' | 'monthly';

export type Appointment = {
  id: string;
  title: string;
  type: AppointmentType;
  date: IsoDate;
  /** `HH:mm`, or empty. */
  time: string;
  location: string;
  doctor: string;
  notes: string;
  reminder: ReminderOffset;
  done: boolean;
  recurrence: Recurrence;
};

export type JournalEntry = {
  id: string;
  date: IsoDate;
  mood: string;
  text: string;
  symptoms: string;
  /** Kilograms, or null when not recorded. */
  weight: number | null;
};

export type MedicalRecord = {
  id: string;
  type: RecordType;
  title: string;
  date: IsoDate;
  provider: string;
  notes: string;
  crl: string;
  fhr: string;
  /** Due date assigned by this ultrasound, if any. */
  newEdd: IsoDate | null;
  /** Gestational age in days as measured by the scan, if reported. */
  scanGaDays: number | null;
};

export type WeekVideo = {
  id: string;
  week: number;
  title: string;
  url: string;
  source: string;
  author: string;
  duration: string;
  pubDate: string;
  license: string;
  description: string;
  thumbnailUrl: string;
};

/** Her own status against the advisory test catalogue. Never prescriptive. */
export type TestStatus = 'planned' | 'scheduled' | 'done' | 'skipped';

export type TestTracking = {
  id: string;
  testId: string;
  status: TestStatus;
  notes: string;
  appointmentId: string | null;
};

// Labels are looked up at call time so a language switch takes effect.
const lab = (key: string): string => t(key as StringKey);

export const TEST_STATUSES: readonly TestStatus[] = ['planned', 'scheduled', 'done', 'skipped'];
export const testStatusLabel = (s: TestStatus): string => lab(`type.test.${s}`);

export const APPOINTMENT_TYPES: readonly AppointmentType[] = [
  'doctor',
  'ultrasound',
  'blood',
  'genetic',
  'lab',
  'hospital',
  'vaccine',
  'other',
];
export const appointmentTypeLabel = (v: AppointmentType): string => lab(`type.appt.${v}`);

export const RECORD_TYPES: readonly RecordType[] = [
  'blood',
  'ultrasound',
  'report',
  'lab',
  'rx',
  'photo',
  'note',
];
export const recordTypeLabel = (v: RecordType): string => lab(`type.record.${v}`);

export const REMINDER_OFFSETS: readonly ReminderOffset[] = ['', '1h', '24h', '48h', 'week'];
export const reminderLabel = (v: ReminderOffset): string => lab(`type.reminder.${v || 'none'}`);

export const RECURRENCES: readonly Recurrence[] = ['', 'weekly', 'biweekly', 'monthly'];
export const recurrenceLabel = (v: Recurrence): string => lab(`type.rec.${v || 'none'}`);

/** Moods are persisted as these exact Arabic strings; never change them. */
export const MOODS = [
  'سعيدة ❤️',
  'ممتنة',
  'متحمسة',
  'متعبة',
  'قلقة',
  'هادئة',
] as const;

const MOOD_KEYS: Record<string, string> = {
  'سعيدة ❤️': 'happy',
  'ممتنة': 'grateful',
  'متحمسة': 'excited',
  'متعبة': 'tired',
  'قلقة': 'anxious',
  'هادئة': 'calm',
};

/** Display text for a stored mood; unknown values show as stored. */
export const moodLabel = (stored: string): string =>
  MOOD_KEYS[stored] ? lab(`type.mood.${MOOD_KEYS[stored]}`) : stored;
