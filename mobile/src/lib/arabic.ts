/**
 * Arabic formatting helpers, ported from the prototype's DCLogic methods.
 *
 * The prototype leaned on `Intl.DateTimeFormat('ar-SA-u-ca-gregory-nu-latn')`.
 * We spell the names out instead: Hermes' Intl support varies by platform and
 * engine build, and a wrong calendar (Hijri instead of Gregorian) or Arabic-Indic
 * digits would silently change every date in the app. These tables are the
 * ar-SA Gregorian names with Latin digits — the exact combination the prototype
 * asked Intl for.
 */

const MONTHS = [
  'يناير',
  'فبراير',
  'مارس',
  'أبريل',
  'مايو',
  'يونيو',
  'يوليو',
  'أغسطس',
  'سبتمبر',
  'أكتوبر',
  'نوفمبر',
  'ديسمبر',
] as const;

/** Sunday-first, matching `Date.getDay()`. */
const WEEKDAYS = [
  'الأحد',
  'الإثنين',
  'الثلاثاء',
  'الأربعاء',
  'الخميس',
  'الجمعة',
  'السبت',
] as const;

/** Column headings in the month grid — the prototype's `wdNames`, verbatim. */
export const WEEKDAY_SHORT = [
  'أحد',
  'إثنين',
  'ثلاثاء',
  'أربعاء',
  'خميس',
  'جمعة',
  'سبت',
] as const;

/** `13 أغسطس 2026` */
export function formatLong(d: Date): string {
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

/** `13 أغسطس` */
export function formatDayMonth(d: Date): string {
  return `${d.getDate()} ${MONTHS[d.getMonth()]}`;
}

/** `الخميس` */
export function formatWeekday(d: Date): string {
  return WEEKDAYS[d.getDay()];
}

/** `أغسطس 2026` */
export function formatMonthYear(d: Date): string {
  return `${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

export function monthName(monthIndex: number): string {
  return MONTHS[monthIndex];
}

/**
 * Arabic count agreement. Mirrors the prototype's `arN`: singular and dual are
 * words on their own (no numeral), 3–10 takes the plural, 11+ takes the
 * accusative singular.
 */
function pluralize(
  n: number,
  one: string,
  two: string,
  few: string,
  many: string,
): string {
  const abs = Math.abs(n);
  if (abs === 1) return one;
  if (abs === 2) return two;
  if (abs >= 3 && abs <= 10) return `${abs} ${few}`;
  return `${abs} ${many}`;
}

/** `يوم واحد` · `يومان` · `5 أيام` · `12 يومًا` */
export function days(n: number): string {
  return pluralize(n, 'يوم واحد', 'يومان', 'أيام', 'يومًا');
}

/** `أسبوع واحد` · `أسبوعان` · `5 أسابيع` · `12 أسبوعًا` */
export function weeks(n: number): string {
  return pluralize(n, 'أسبوع واحد', 'أسبوعان', 'أسابيع', 'أسبوعًا');
}

const ONES = [
  '',
  'الأول',
  'الثاني',
  'الثالث',
  'الرابع',
  'الخامس',
  'السادس',
  'السابع',
  'الثامن',
  'التاسع',
  'العاشر',
] as const;

/** Ones digit when it is part of a compound ordinal (11–19, 21–39, …). */
const COMPOUND_ONES = [
  '',
  'الحادي',
  'الثاني',
  'الثالث',
  'الرابع',
  'الخامس',
  'السادس',
  'السابع',
  'الثامن',
  'التاسع',
] as const;

const TENS: Record<number, string> = {
  2: 'العشرون',
  3: 'الثلاثون',
  4: 'الأربعون',
};

/**
 * Masculine ordinal for a week number: 1 → `الأول`, 14 → `الرابع عشر`,
 * 20 → `العشرون`, 31 → `الحادي والثلاثون`.
 */
export function ordinal(n: number): string {
  if (n <= 10) return ONES[n] ?? '';
  if (n < 20) return `${COMPOUND_ONES[n - 10]} عشر`;
  if (n % 10 === 0) return TENS[n / 10] ?? '';
  return `${COMPOUND_ONES[n % 10]} و${TENS[Math.floor(n / 10)] ?? ''}`;
}

/** `الأسبوع الرابع عشر` */
export function weekOrdinalLabel(n: number): string {
  return `الأسبوع ${ordinal(n)}`;
}
