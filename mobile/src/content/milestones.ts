/**
 * Milestone state.
 *
 * The rule this module exists to enforce (spec §17): reaching a date does not
 * mean a clinical event happened. A heartbeat is confirmed by a sonographer, not
 * by a calendar. So a milestone is only ever reported as **confirmed** when the
 * mother has recorded something that confirms it; until then the strongest thing
 * the app will say is that it is *expected* around this stage.
 *
 * Calendar milestones — "first trimester complete", "37 weeks", the due date —
 * are different in kind: they are statements about gestational age itself, so
 * they legitimately land when the date does.
 */

import type { Appointment, MedicalRecord } from '../store/types';
import { diffDays, fromIso } from '../lib/dates';
import { days } from '../lib/arabic';
import { MILESTONES, type Milestone } from './pregnancyData';

/** What would let the app say a milestone actually happened. */
export type ConfirmationSource =
  /** Purely a statement about gestational age — the date is the event. */
  | 'calendar'
  /** Needs an ultrasound on file. */
  | 'ultrasound'
  /** Needs an attended appointment on file. */
  | 'appointment'
  /** Hers to report; the app never assumes it. */
  | 'self';

/**
 * How each milestone can be confirmed. Keyed by the ids in `pregnancyData`.
 *
 * Anything scan-visible is `ultrasound`: the gestational sac, the yolk sac,
 * seeing the embryo, cardiac activity, the anatomy scan.
 */
const CONFIRMATION: Record<string, ConfirmationSource> = {
  detected: 'self',
  'first-test': 'self',
  'first-visit': 'appointment',
  sac: 'ultrasound',
  yolk: 'ultrasound',
  embryo: 'ultrasound',
  heart: 'ultrasound',
  anatomy: 'ultrasound',
  movement: 'self',
  't1-done': 'calendar',
  t3: 'calendar',
  w37: 'calendar',
  w40: 'calendar',
  edd: 'calendar',
};

export type MilestoneState =
  /** Confirmed: either a calendar fact, or backed by something she recorded. */
  | { status: 'confirmed'; label: string }
  /** The window has arrived but nothing confirms it yet. */
  | { status: 'expected'; label: string }
  /** Still ahead. */
  | { status: 'upcoming'; label: string };

export type MilestoneWithState = Milestone & {
  confirmedBy: ConfirmationSource;
  state: MilestoneState;
};

export function confirmationSourceFor(milestone: Milestone): ConfirmationSource {
  // Fall back to the data file's own flag if an id ever appears without a rule:
  // `auto` marks the calendar milestones.
  return CONFIRMATION[milestone.id] ?? (milestone.auto ? 'calendar' : 'self');
}

/**
 * Resolves every milestone against where she is and what she has recorded.
 *
 * @param gestationalDay Days elapsed, from `computeJourney`.
 * @param effectiveLmp   The LMP the calendar runs on.
 */
export function milestonesWithState(
  gestationalDay: number,
  effectiveLmp: Date,
  records: readonly MedicalRecord[],
  appointments: readonly Appointment[],
): MilestoneWithState[] {
  return MILESTONES.map((milestone) => {
    const confirmedBy = confirmationSourceFor(milestone);
    // A milestone's window opens on the first day of its week.
    const milestoneDay = (milestone.week - 1) * 7;
    const daysAway = milestoneDay - gestationalDay;
    const windowOpen = daysAway <= 0;

    if (!windowOpen) {
      return {
        ...milestone,
        confirmedBy,
        state: { status: 'upcoming', label: `باقي ${days(daysAway)}` },
      };
    }

    if (confirmedBy === 'calendar') {
      return {
        ...milestone,
        confirmedBy,
        state: { status: 'confirmed', label: 'وصلتِ لهذه المرحلة' },
      };
    }

    // Only evidence dated at or after the milestone's own week can confirm it —
    // a six-week scan says nothing about the twenty-week anatomy scan.
    const windowStart = new Date(effectiveLmp);
    windowStart.setDate(windowStart.getDate() + milestoneDay);

    if (confirmedBy === 'ultrasound') {
      const scan = records.find(
        (record) =>
          record.type === 'ultrasound' && diffDays(fromIso(record.date), windowStart) >= 0,
      );
      if (scan) {
        return {
          ...milestone,
          confirmedBy,
          state: { status: 'confirmed', label: 'مؤكد بتقرير السونار' },
        };
      }
      return {
        ...milestone,
        confirmedBy,
        state: { status: 'expected', label: 'متوقع حول هذه المرحلة — يؤكده الطبيب بالسونار' },
      };
    }

    if (confirmedBy === 'appointment') {
      const visit = appointments.find(
        (appointment) =>
          appointment.done && diffDays(fromIso(appointment.date), windowStart) >= 0,
      );
      if (visit) {
        return {
          ...milestone,
          confirmedBy,
          state: { status: 'confirmed', label: 'مؤكد — تمت الزيارة' },
        };
      }
      return {
        ...milestone,
        confirmedBy,
        state: { status: 'expected', label: 'عادةً حول هذه المرحلة — سجّلي الزيارة عند إتمامها' },
      };
    }

    return {
      ...milestone,
      confirmedBy,
      state: { status: 'expected', label: 'قد يحدث حول هذه المرحلة — تختلف بين النساء' },
    };
  });
}
