/**
 * Gestational-age maths, ported from the prototype's `calc()`.
 *
 * The clinical convention the whole app rests on: gestational age is counted
 * from the first day of the last menstrual period (LMP), not from conception,
 * and a term pregnancy is 280 days from that point.
 */

import { addDays, diffDays, fromIso, startOfDay, type IsoDate } from './dates';

/** Days from LMP to the estimated due date. */
export const TERM_DAYS = 280;

/** Gestational day the second and third trimesters begin on. */
const SECOND_TRIMESTER_DAY = 91;
const THIRD_TRIMESTER_DAY = 189;

/**
 * How far past the LMP the calendar stays navigable: 42 weeks, so the weeks
 * after the due date are still browsable.
 */
export const CALENDAR_SPAN_DAYS = 294;

export const DEFAULT_CYCLE_LENGTH = 28;

export type PregnancyStatus = 'pregnant' | 'planning';

export type Settings = {
  lmp: IsoDate;
  cycleLength: number;
  status: PregnancyStatus;
  /** Clinician-assigned due date; when set, the calendar is rebuilt from it. */
  eddOverride: IsoDate | null;
  babyName: string;
  motherName: string;
  doctor: string;
};

export type Journey = {
  lmp: Date;
  /** Estimated due date. */
  edd: Date;
  /**
   * The LMP the calendar actually runs on. With no override this equals `lmp`
   * plus the cycle adjustment; with an override it is back-derived as
   * `edd - 280` so that "day N of 280" stays consistent with the new due date.
   */
  effectiveLmp: Date;
  today: Date;
  /** Days elapsed since the effective LMP. 0 on the LMP itself. */
  gestationalDay: number;
  /** 1-based counterpart of `gestationalDay` — the "day N of 280" figure. */
  dayNumber: number;
  /** 1-based gestational week. */
  week: number;
  /** Completed weeks, as in "14 weeks and 3 days". */
  gaWeeks: number;
  /** Days beyond `gaWeeks`. */
  gaDays: number;
  daysLeft: number;
  trimester: 1 | 2 | 3;
};

/**
 * Builds the journey for a given day.
 *
 * A cycle longer than 28 days means ovulation happened later, so the due date
 * moves out by the difference — the standard Naegele adjustment.
 */
export function computeJourney(settings: Settings, now: Date = new Date()): Journey {
  const lmp = fromIso(settings.lmp);
  const cycleAdjustment =
    (Number.isFinite(settings.cycleLength) ? settings.cycleLength : DEFAULT_CYCLE_LENGTH) -
    DEFAULT_CYCLE_LENGTH;

  const edd = settings.eddOverride
    ? fromIso(settings.eddOverride)
    : addDays(lmp, TERM_DAYS + cycleAdjustment);

  const effectiveLmp = addDays(edd, -TERM_DAYS);
  const today = startOfDay(now);
  const gestationalDay = diffDays(today, effectiveLmp);

  return {
    lmp,
    edd,
    effectiveLmp,
    today,
    gestationalDay,
    dayNumber: gestationalDay + 1,
    week: Math.floor(gestationalDay / 7) + 1,
    gaWeeks: Math.floor(gestationalDay / 7),
    gaDays: ((gestationalDay % 7) + 7) % 7,
    daysLeft: Math.max(0, diffDays(edd, today)),
    trimester: trimesterFor(gestationalDay),
  };
}

export function trimesterFor(gestationalDay: number): 1 | 2 | 3 {
  if (gestationalDay < SECOND_TRIMESTER_DAY) return 1;
  if (gestationalDay < THIRD_TRIMESTER_DAY) return 2;
  return 3;
}

/**
 * Whole weeks until the next trimester, or `null` in the third — used for the
 * "باقي N أسابيع على الثلث الثاني" tile.
 */
export function weeksToNextTrimester(gestationalDay: number): number | null {
  const trimester = trimesterFor(gestationalDay);
  if (trimester === 1) return Math.ceil((SECOND_TRIMESTER_DAY - gestationalDay) / 7);
  if (trimester === 2) return Math.ceil((THIRD_TRIMESTER_DAY - gestationalDay) / 7);
  return null;
}

/** Weeks the UI can navigate to, independent of which weeks have content. */
export const MIN_WEEK = 1;
export const MAX_WEEK = 42;

export function clampWeek(week: number): number {
  return Math.min(Math.max(week, MIN_WEEK), MAX_WEEK);
}

/** Date the given 1-based gestational week starts on. */
export function weekStart(journey: Journey, week: number): Date {
  return addDays(journey.effectiveLmp, (week - 1) * 7);
}

/** Progress around the ring, 0–100. */
export function progressPercent(journey: Journey): number {
  return Math.min(100, Math.max(0, (journey.dayNumber / TERM_DAYS) * 100));
}

/** Gestational day for a calendar date, or `null` if it falls outside. */
export function gestationalDayFor(journey: Journey, date: Date): number | null {
  const g = diffDays(date, journey.effectiveLmp);
  return g >= 0 && g < CALENDAR_SPAN_DAYS ? g : null;
}

/** The week whose illustration should be shown (content exists for 4–40). */
export function illustrationWeek(week: number): number {
  return Math.min(Math.max(week, 4), 40);
}
