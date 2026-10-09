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
  /** Systolic mmHg, or null when not recorded. */
  bpSystolic: number | null;
  /** Diastolic mmHg, or null when not recorded. */
  bpDiastolic: number | null;
  /** Fundal height in centimetres, or null when not recorded. */
  fundalHeightCm: number | null;
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
