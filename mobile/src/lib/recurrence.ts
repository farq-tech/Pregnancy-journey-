/**
 * Expanding a repeat rule into actual follow-up dates.
 *
 * Antenatal visits get closer together as the pregnancy goes on — roughly
 * monthly, then fortnightly, then weekly — so "every 2 weeks" is a real clinical
 * pattern rather than a generic calendar feature.
 */

import { addDays, diffDays, fromIso, toIso, type IsoDate } from './dates';
import { TERM_DAYS, computeJourney, type Settings } from './pregnancy';
import type { Recurrence } from '../store/types';

const STEP_DAYS: Record<Exclude<Recurrence, ''>, number> = {
  weekly: 7,
  biweekly: 14,
  monthly: 28,
};

/**
 * A hard cap on how many rows one save can create, so a mistyped rule cannot
 * flood the calendar.
 */
export const MAX_OCCURRENCES = 12;

/**
 * Dates for the follow-up occurrences after `startDate`, excluding the first
 * appointment itself.
 *
 * Repeats stop at the due date: appointments past it would be guesses about a
 * pregnancy that has ended. With no profile to read a due date from, the term
 * length is used instead.
 */
export function recurringDates(
  startDate: IsoDate,
  recurrence: Recurrence,
  settings: Settings | null,
): IsoDate[] {
  if (!recurrence) return [];

  const step = STEP_DAYS[recurrence];
  const start = fromIso(startDate);

  const lastDate = settings
    ? computeJourney(settings, start).edd
    : addDays(start, TERM_DAYS);

  const dates: IsoDate[] = [];
  for (let index = 1; index <= MAX_OCCURRENCES; index += 1) {
    const next = addDays(start, step * index);
    if (diffDays(next, lastDate) > 0) break;
    dates.push(toIso(next));
  }
  return dates;
}
