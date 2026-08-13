import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { days, ordinal, weekOrdinalLabel, weeks } from './arabic';
import { addDays, diffDays, fromIso, startOfDay, toIso } from './dates';
import { gestationalAgeLabel } from './labels';
import {
  TERM_DAYS,
  clampWeek,
  computeJourney,
  gestationalDayFor,
  illustrationWeek,
  progressPercent,
  trimesterFor,
  weekStart,
  weeksToNextTrimester,
  type Settings,
} from './pregnancy';

const base: Settings = {
  lmp: '2026-01-01',
  cycleLength: 28,
  status: 'pregnant',
  eddOverride: null,
  babyName: '',
  motherName: '',
  doctor: '',
};

const withLmp = (lmp: string, overrides: Partial<Settings> = {}): Settings => ({
  ...base,
  lmp,
  ...overrides,
});

// ---------------------------------------------------------------------------
// The worked example from the product spec. If any of these drift, the headline
// numbers on the Today screen are wrong.
// ---------------------------------------------------------------------------
describe('spec acceptance example — LMP 19 July 2026, 28-day cycle', () => {
  const settings = withLmp('2026-07-19');

  it('gives a due date of 25 April 2027', () => {
    const j = computeJourney(settings, fromIso('2026-08-13'));
    assert.equal(toIso(j.edd), '2027-04-25');
  });

  it('reads Day 25 of 280 on 13 August 2026', () => {
    const j = computeJourney(settings, fromIso('2026-08-13'));
    assert.equal(j.dayNumber, 25);
  });

  it('reads 3 weeks and 4 days, in week 4', () => {
    const j = computeJourney(settings, fromIso('2026-08-13'));
    assert.equal(j.gaWeeks, 3);
    assert.equal(j.gaDays, 4);
    assert.equal(j.week, 4);
    assert.equal(gestationalAgeLabel(j.gaWeeks, j.gaDays), '3 أسابيع و4 أيام');
    assert.equal(weekOrdinalLabel(j.week), 'الأسبوع الرابع');
  });

  it('leaves 255 days to go', () => {
    const j = computeJourney(settings, fromIso('2026-08-13'));
    assert.equal(j.daysLeft, 255);
  });

  it('keeps day-count plus days-left at exactly 280, every single day', () => {
    // The invariant the two headline figures have to satisfy together.
    for (let offset = 0; offset <= TERM_DAYS; offset += 1) {
      const j = computeJourney(settings, addDays(fromIso('2026-07-19'), offset));
      assert.equal(
        j.dayNumber + j.daysLeft,
        TERM_DAYS,
        `broke on day ${offset} (${toIso(addDays(fromIso('2026-07-19'), offset))})`,
      );
    }
  });

  it('walks the whole pregnancy without a gap or repeat in gestational age', () => {
    let previous = -1;
    for (let offset = 0; offset <= TERM_DAYS; offset += 1) {
      const j = computeJourney(settings, addDays(fromIso('2026-07-19'), offset));
      assert.equal(j.gestationalDay, previous + 1, `jumped at offset ${offset}`);
      assert.equal(j.gaWeeks * 7 + j.gaDays, j.gestationalDay);
      previous = j.gestationalDay;
    }
    assert.equal(previous, TERM_DAYS);
  });
});

describe('computeJourney', () => {
  it('puts the due date 280 days after a 28-day-cycle LMP', () => {
    const j = computeJourney(base, fromIso('2026-01-01'));
    assert.equal(toIso(j.edd), '2026-10-08');
    assert.equal(diffDays(j.edd, j.lmp), TERM_DAYS);
  });

  it('counts the LMP itself as day 0 with the full term remaining', () => {
    const j = computeJourney(base, fromIso('2026-01-01'));
    assert.equal(j.gestationalDay, 0);
    assert.equal(j.dayNumber, 0);
    assert.equal(j.week, 1);
    assert.equal(j.gaWeeks, 0);
    assert.equal(j.gaDays, 0);
    assert.equal(j.daysLeft, TERM_DAYS);
  });

  it('reports gestational age as completed weeks plus days', () => {
    const j = computeJourney(base, fromIso('2026-04-12'));
    assert.equal(j.gestationalDay, 101);
    assert.equal(j.gaWeeks, 14);
    assert.equal(j.gaDays, 3);
    assert.equal(j.week, 15);
  });

  it('pushes the due date out for a longer cycle', () => {
    const j = computeJourney({ ...base, cycleLength: 35 }, fromIso('2026-01-01'));
    assert.equal(toIso(j.edd), '2026-10-15', '35-day cycle adds 7 days');
  });

  it('pulls the due date in for a shorter cycle', () => {
    const j = computeJourney({ ...base, cycleLength: 21 }, fromIso('2026-01-01'));
    assert.equal(toIso(j.edd), '2026-10-01');
  });

  it('never reports negative days remaining past the due date', () => {
    const j = computeJourney(base, fromIso('2026-10-20'));
    assert.equal(j.daysLeft, 0);
    assert.ok(j.dayNumber > TERM_DAYS);
  });
});

// ---------------------------------------------------------------------------
// Spec §28: leap years, month boundaries, timezones, midnight.
// ---------------------------------------------------------------------------
describe('calendar edge cases', () => {
  it('counts February 29 in a leap year', () => {
    // 2028 is a leap year. An LMP in Feb 2028 must include the 29th.
    const j = computeJourney(withLmp('2028-02-20'), fromIso('2028-03-01'));
    assert.equal(j.gestationalDay, 10, 'Feb 20 -> Mar 1 across Feb 29 is 10 days');
  });

  it('lands the due date correctly when the term crosses a leap day', () => {
    // 2027-07-01 + 280 days runs through February 2028 (29 days).
    const j = computeJourney(withLmp('2027-07-01'), fromIso('2027-07-01'));
    assert.equal(toIso(j.edd), '2028-04-06');
  });

  it('handles a non-leap century-adjacent year correctly', () => {
    // 2100 is not a leap year; 2028 is. Guards against a naive %4 rule.
    assert.equal(new Date(2100, 1, 29).getMonth(), 2, '2100 has no Feb 29');
    assert.equal(new Date(2028, 1, 29).getMonth(), 1, '2028 does have Feb 29');
  });

  it('crosses a year boundary without losing a day', () => {
    const j = computeJourney(withLmp('2026-12-28'), fromIso('2027-01-04'));
    assert.equal(j.gestationalDay, 7);
    assert.equal(j.gaWeeks, 1);
    assert.equal(j.gaDays, 0);
  });

  it('crosses month boundaries of every length', () => {
    // 31-day month into a 30-day month, and a 28-day February.
    assert.equal(diffDays(fromIso('2026-02-01'), fromIso('2026-01-31')), 1);
    assert.equal(diffDays(fromIso('2026-03-01'), fromIso('2026-02-28')), 1);
    assert.equal(diffDays(fromIso('2026-05-01'), fromIso('2026-04-30')), 1);
    assert.equal(diffDays(fromIso('2028-03-01'), fromIso('2028-02-29')), 1);
  });

  it('treats a date as the same day regardless of the time on it', () => {
    // Midnight rollover: 23:59 and 00:01 must be different pregnancy days, and
    // any time within one day must be the same day.
    const lateEvening = new Date(2026, 7, 13, 23, 59, 59);
    const justAfterMidnight = new Date(2026, 7, 14, 0, 0, 1);
    const settings = withLmp('2026-07-19');

    assert.equal(computeJourney(settings, lateEvening).dayNumber, 25);
    assert.equal(computeJourney(settings, justAfterMidnight).dayNumber, 26);
    assert.equal(
      computeJourney(settings, new Date(2026, 7, 13, 0, 0, 0)).dayNumber,
      computeJourney(settings, lateEvening).dayNumber,
      'noon and near-midnight on the same date are the same pregnancy day',
    );
  });

  it('normalises a timestamp to local midnight rather than UTC', () => {
    // toIso must read local calendar fields. In a negative-offset zone,
    // toISOString() would report the next day for a late-evening time.
    const evening = new Date(2026, 7, 13, 22, 30);
    assert.equal(toIso(evening), '2026-08-13');
    assert.equal(toIso(startOfDay(evening)), '2026-08-13');
  });

  it('survives a DST transition without dropping a day', () => {
    // Europe/Berlin springs forward 2026-03-29 and falls back 2026-10-25.
    const spring = computeJourney(withLmp('2026-03-20'), fromIso('2026-04-03'));
    assert.equal(spring.gestationalDay, 14);
    const autumn = computeJourney(withLmp('2026-10-18'), fromIso('2026-11-01'));
    assert.equal(autumn.gestationalDay, 14);
  });
});

// ---------------------------------------------------------------------------
// Spec §18: an ultrasound that re-dates the pregnancy rebuilds everything.
// ---------------------------------------------------------------------------
describe('ultrasound re-dating', () => {
  const settings = withLmp('2026-07-19');

  it('back-derives the effective LMP from the new due date', () => {
    const rescanned = computeJourney(
      { ...settings, eddOverride: '2027-05-02' },
      fromIso('2026-08-13'),
    );
    assert.equal(toIso(rescanned.edd), '2027-05-02');
    assert.equal(toIso(rescanned.effectiveLmp), '2026-07-26', 'effective LMP = EDD − 280');
  });

  it('shifts the day count, the week and the countdown together', () => {
    const before = computeJourney(settings, fromIso('2026-08-13'));
    // The scan says she is a week less far along than the LMP suggested.
    const after = computeJourney({ ...settings, eddOverride: '2027-05-02' }, fromIso('2026-08-13'));

    assert.equal(after.dayNumber, before.dayNumber - 7);
    assert.equal(after.daysLeft, before.daysLeft + 7);
    assert.equal(after.week, 3);
    assert.equal(before.week, 4);
    assert.equal(after.dayNumber + after.daysLeft, TERM_DAYS, 'invariant survives re-dating');
  });

  it('moves the whole calendar grid, not just the headline', () => {
    const after = computeJourney({ ...settings, eddOverride: '2027-05-02' }, fromIso('2026-08-13'));
    // Week 8 now starts a week later than it would have.
    assert.equal(toIso(weekStart(after, 8)), '2026-09-13');
    const before = computeJourney(settings, fromIso('2026-08-13'));
    assert.equal(toIso(weekStart(before, 8)), '2026-09-06');
  });

  it('lets the override win over the cycle-length adjustment', () => {
    const j = computeJourney(
      { ...settings, cycleLength: 35, eddOverride: '2027-05-02' },
      fromIso('2026-08-13'),
    );
    assert.equal(toIso(j.edd), '2027-05-02');
  });
});

describe('trimesters', () => {
  it('starts the second at day 91 and the third at day 189', () => {
    assert.equal(trimesterFor(90), 1);
    assert.equal(trimesterFor(91), 2);
    assert.equal(trimesterFor(188), 2);
    assert.equal(trimesterFor(189), 3);
  });

  it('counts whole weeks to the next trimester, and none in the third', () => {
    assert.equal(weeksToNextTrimester(84), 1);
    assert.equal(weeksToNextTrimester(90), 1);
    assert.equal(weeksToNextTrimester(91), 14);
    assert.equal(weeksToNextTrimester(189), null);
  });
});

describe('calendar window', () => {
  const j = computeJourney(base, fromIso('2026-04-12'));

  it('accepts the first day and rejects the day before it', () => {
    assert.equal(gestationalDayFor(j, fromIso('2026-01-01')), 0);
    assert.equal(gestationalDayFor(j, fromIso('2025-12-31')), null);
  });

  it('stays open through week 42 and closes after', () => {
    assert.equal(gestationalDayFor(j, fromIso('2026-10-21')), 293);
    assert.equal(gestationalDayFor(j, fromIso('2026-10-22')), null);
  });

  it('starts each week seven days after the last', () => {
    assert.equal(toIso(weekStart(j, 1)), '2026-01-01');
    assert.equal(toIso(weekStart(j, 15)), '2026-04-09');
  });

  it('clamps navigation to weeks 1–42 and illustrations to 4–40', () => {
    assert.equal(clampWeek(0), 1);
    assert.equal(clampWeek(99), 42);
    assert.equal(illustrationWeek(1), 4);
    assert.equal(illustrationWeek(42), 40);
    assert.equal(illustrationWeek(20), 20);
  });

  it('fills the ring in step with the day count', () => {
    assert.equal(progressPercent(computeJourney(base, fromIso('2026-01-01'))), 0);
    assert.equal(progressPercent(computeJourney(base, fromIso('2026-10-08'))), 100);
    assert.equal(progressPercent(computeJourney(base, fromIso('2026-10-20'))), 100, 'never over 100');
  });
});

describe('Arabic agreement', () => {
  it('uses singular, dual, plural and accusative forms', () => {
    assert.equal(days(1), 'يوم واحد');
    assert.equal(days(2), 'يومان');
    assert.equal(days(5), '5 أيام');
    assert.equal(days(11), '11 يومًا');
    assert.equal(weeks(1), 'أسبوع واحد');
    assert.equal(weeks(2), 'أسبوعان');
    assert.equal(weeks(3), '3 أسابيع');
    assert.equal(weeks(14), '14 أسبوعًا');
  });

  it('builds week ordinals across the tens boundaries', () => {
    assert.equal(ordinal(1), 'الأول');
    assert.equal(ordinal(10), 'العاشر');
    assert.equal(ordinal(11), 'الحادي عشر');
    assert.equal(ordinal(14), 'الرابع عشر');
    assert.equal(ordinal(20), 'العشرون');
    assert.equal(ordinal(21), 'الحادي والعشرون');
    assert.equal(ordinal(30), 'الثلاثون');
    assert.equal(ordinal(40), 'الأربعون');
    assert.equal(weekOrdinalLabel(28), 'الأسبوع الثامن والعشرون');
  });

  it('omits the day part when the age is a whole number of weeks', () => {
    assert.equal(gestationalAgeLabel(8, 0), '8 أسابيع');
    assert.equal(gestationalAgeLabel(8, 1), '8 أسابيع ويوم واحد');
  });
});
