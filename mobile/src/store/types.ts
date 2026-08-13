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
