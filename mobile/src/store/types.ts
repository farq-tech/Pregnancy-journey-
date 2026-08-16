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

/**
 * One "count to ten" sitting. `endedAt` is null while it is still running, so a
 * session survives the app being backgrounded mid-count.
 */
export type KickSession = {
  id: string;
  date: IsoDate;
  /** ISO timestamp. */
  startedAt: string;
  /** ISO timestamp, or null while running. */
  endedAt: string | null;
  count: number;
  note: string;
};

export type Contraction = {
  id: string;
  /** ISO timestamp of the moment it began. */
  startedAt: string;
  durationSeconds: number;
  note: string;
};

export type MeasurementKind = 'weight' | 'bp' | 'glucose';

export type Measurement = {
  id: string;
  date: IsoDate;
  kind: MeasurementKind;
  /** Kilograms, systolic, or mg/dL depending on `kind`. */
  value: number;
  /** Diastolic, on a blood-pressure reading only. */
  value2: number | null;
  /** Fasting / after a meal, on a glucose reading. */
  context: string;
  notes: string;
};

/**
 * One ticked line on a preparation list. Curated items carry an `itemId` from
 * `content/checklists.ts` and an empty `label`; her own additions carry a
 * generated id and their text.
 */
export type ChecklistTick = {
  id: string;
  listId: string;
  itemId: string;
  label: string;
  done: boolean;
};

/** A letter to the baby — from her, or from anyone else in the family. */
export type Letter = {
  id: string;
  date: IsoDate;
  title: string;
  body: string;
  /** Who wrote it, as they want to be remembered. Empty means the mother. */
  author: string;
};

export const MEASUREMENT_KIND_LABELS: Record<MeasurementKind, string> = {
  weight: 'الوزن',
  bp: 'ضغط الدم',
  glucose: 'سكر الدم',
};

export const MEASUREMENT_UNITS: Record<MeasurementKind, string> = {
  weight: 'كغم',
  bp: 'ملم زئبق',
  glucose: 'ملغم/دل',
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

export const TEST_STATUS_LABELS: Record<TestStatus, string> = {
  planned: 'لم يُحدَّد بعد',
  scheduled: 'محجوز',
  done: 'تم',
  skipped: 'غير مطلوب',
};

export const RECURRENCE_LABELS: Record<Recurrence, string> = {
  '': 'موعد واحد',
  weekly: 'كل أسبوع',
  biweekly: 'كل أسبوعين',
  monthly: 'كل شهر',
};

export const APPOINTMENT_TYPE_LABELS: Record<AppointmentType, string> = {
  doctor: 'موعد طبيب',
  ultrasound: 'سونار',
  blood: 'تحليل دم',
  genetic: 'فحص جيني',
  lab: 'مختبر',
  hospital: 'مستشفى',
  vaccine: 'تطعيم',
  other: 'أخرى',
};

export const RECORD_TYPE_LABELS: Record<RecordType, string> = {
  blood: 'تحليل دم',
  ultrasound: 'سونار',
  report: 'تقرير طبيب',
  lab: 'نتيجة مختبر',
  rx: 'وصفة طبية',
  photo: 'صورة',
  note: 'ملاحظة',
};

export const REMINDER_LABELS: Record<ReminderOffset, string> = {
  '': 'بدون تذكير',
  '1h': 'قبل ساعة',
  '24h': 'قبل 24 ساعة',
  '48h': 'قبل يومين',
  week: 'قبل أسبوع',
};

export const MOODS = [
  'سعيدة ❤️',
  'ممتنة',
  'متحمسة',
  'متعبة',
  'قلقة',
  'هادئة',
] as const;
