/** Label builders shared by more than one screen. */

import { days, months, ordinal, weeks } from './arabic';
import { diffDays, fromIso, type IsoDate } from './dates';

/** `14 أسبوعًا و3 أيام` — completed weeks, then the leftover days. */
export function gestationalAgeLabel(gaWeeks: number, gaDays: number): string {
  return weeks(gaWeeks) + (gaDays ? ` و${days(gaDays)}` : '');
}

/** `اليوم` · `غدًا` · `باقي 5 أيام` · `انتهى` */
export function countdownLabel(date: IsoDate, today: Date): string {
  const delta = diffDays(fromIso(date), today);
  if (delta < 0) return 'انتهى';
  if (delta === 0) return 'اليوم';
  if (delta === 1) return 'غدًا';
  return `باقي ${days(delta)}`;
}

/** Joins the parts of a subtitle, dropping the empty ones. */
export function joinMeta(...parts: (string | null | undefined)[]): string {
  return parts.filter(Boolean).join(' · ');
}

/** `الشهر الرابع · 3 أشهر مكتملة` — the month she is in, plus completed months. */
export function monthLabel(monthNumber: number, gaMonths: number): string {
  const current = `الشهر ${ordinal(monthNumber)}`;
  return gaMonths ? `${current} · ${months(gaMonths)} مكتملة` : current;
}
