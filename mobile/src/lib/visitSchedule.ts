/**
 * Typical antenatal visit *windows*, not a prescription.
 *
 * Dates are derived from the effective LMP / EDD so a dating scan that
 * rewrites the calendar moves the suggestions with it. She confirms each
 * one; nothing is written until she taps.
 */

import { addDays, diffDays, fromIso, toIso, type IsoDate } from './dates';
import type { Appointment, AppointmentType } from '../store/types';
import type { Journey } from './pregnancy';

export type SuggestedVisitId = 'booking' | 'nt' | 'anomaly' | 'gtt' | 'week36';

export type SuggestedVisit = {
  id: SuggestedVisitId;
  title: string;
  type: AppointmentType;
  /** 1-based gestational week used as the default date (start of that week). */
  defaultWeek: number;
  windowStartWeek: number;
  windowEndWeek: number;
  notes: string;
};

export const SUGGESTED_VISITS: readonly SuggestedVisit[] = [
  {
    id: 'booking',
    title: 'زيارة الحجز الأولى',
    type: 'doctor',
    defaultWeek: 8,
    windowStartWeek: 6,
    windowEndWeek: 10,
    notes: 'نافذة شائعة للزيارة الأولى — أكّدي الموعد مع عيادتك.',
  },
  {
    id: 'nt',
    title: 'سونار الشفافية القفوية',
    type: 'ultrasound',
    defaultWeek: 12,
    windowStartWeek: 11,
    windowEndWeek: 14,
    notes: 'يُعرض عادة بين الأسبوعين 11 و14.',
  },
  {
    id: 'anomaly',
    title: 'السونار التفصيلي',
    type: 'ultrasound',
    defaultWeek: 20,
    windowStartWeek: 18,
    windowEndWeek: 22,
    notes: 'فحص التشريح التفصيلي يُجرى غالبًا حول الأسبوع 20.',
  },
  {
    id: 'gtt',
    title: 'تحليل سكر الحمل',
    type: 'blood',
    defaultWeek: 26,
    windowStartWeek: 24,
    windowEndWeek: 28,
    notes: 'اختبار تحمل الجلوكوز يُطلب عادة في هذه النافذة.',
  },
  {
    id: 'week36',
    title: 'مراجعة الأسبوع 36',
    type: 'doctor',
    defaultWeek: 36,
    windowStartWeek: 36,
    windowEndWeek: 37,
    notes: 'مراجعة شائعة قرب نهاية الحمل.',
  },
];

export function suggestedDate(journey: Journey, visit: SuggestedVisit): IsoDate {
  return toIso(addDays(journey.effectiveLmp, (visit.defaultWeek - 1) * 7));
}

function weekOfAppointment(journey: Journey, date: IsoDate): number {
  return Math.floor(diffDays(fromIso(date), journey.effectiveLmp) / 7) + 1;
}

/** True when an existing appointment already covers this suggested window. */
export function alreadyScheduled(
  journey: Journey,
  visit: SuggestedVisit,
  appointments: readonly Appointment[],
): boolean {
  return appointments.some((appointment) => {
    if (appointment.type !== visit.type) return false;
    const week = weekOfAppointment(journey, appointment.date);
    return week >= visit.windowStartWeek && week <= visit.windowEndWeek;
  });
}

export function pendingSuggestions(
  journey: Journey,
  appointments: readonly Appointment[],
): SuggestedVisit[] {
  return SUGGESTED_VISITS.filter((visit) => !alreadyScheduled(journey, visit, appointments));
}
