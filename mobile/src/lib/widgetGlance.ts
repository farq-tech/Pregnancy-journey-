/**
 * The payload the home-screen widget (and the in-app lock-screen card) show:
 * day N of 280, week, and the next appointment. Written whenever the journey
 * refreshes so WidgetKit can read a snapshot without opening the app.
 */

import { formatDayMonth } from './arabic';
import { fromIso } from './dates';
import { countdownLabel } from './labels';
import type { Journey } from './pregnancy';
import { TERM_DAYS, clampWeek } from './pregnancy';
import type { Appointment } from '../store/types';

export const WIDGET_APP_GROUP = 'group.sa.farq.pregnancyjourney';
export const WIDGET_GLANCE_KEY = 'pj_widget_glance_v1';

export type WidgetGlance = {
  dayNumber: number;
  termDays: number;
  week: number;
  nextTitle: string;
  nextWhen: string;
  nextDate: string;
};

export function buildWidgetGlance(
  journey: Journey,
  appointments: readonly Appointment[],
): WidgetGlance {
  const next =
    [...appointments]
      .filter((a) => !a.done && fromIso(a.date) >= journey.today)
      .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time))[0] ?? null;

  return {
    dayNumber: journey.dayNumber,
    termDays: TERM_DAYS,
    week: clampWeek(journey.week),
    nextTitle: next?.title ?? 'لا مواعيد قادمة',
    nextWhen: next ? countdownLabel(next.date, journey.today) : '—',
    nextDate: next ? formatDayMonth(fromIso(next.date)) : '',
  };
}
