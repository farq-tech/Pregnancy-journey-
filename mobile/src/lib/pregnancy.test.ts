import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { days, ordinal, weekOrdinalLabel, weeks } from './arabic';
import { diffDays, fromIso, toIso } from './dates';
import {
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

describe('computeJourney', () => {
  it('puts the due date 280 days after a 28-day-cycle LMP', () => {
    const j = computeJourney(base, fromIso('2026-01-01'));
    assert.equal(toIso(j.edd), '2026-10-08');
    assert.equal(diffDays(j.edd, j.lmp), 280);
  });

  it('counts the LMP itself as day 1 of 280', () => {
    const j = computeJourney(base, fromIso('2026-01-01'));
    assert.equal(j.gestationalDay, 0);
    assert.equal(j.dayNumber, 1);
    assert.equal(j.week, 1);
    assert.equal(j.gaWeeks, 0);
    assert.equal(j.gaDays, 0);
    assert.equal(j.daysLeft, 280);
  });

  it('reports gestational age as completed weeks plus days', () => {
    // 101 days elapsed = 14 weeks + 3 days, i.e. gestational week 15.
    const j = computeJourney(base, fromIso('2026-04-12'));
    assert.equal(j.gestationalDay, 101);
    assert.equal(j.gaWeeks, 14);
    assert.equal(j.gaDays, 3);
    assert.equal(j.week, 15);
  });

  it('pushes the due date out for a longer cycle', () => {
    const j = computeJourney({ ...base, cycleLength: 35 }, fromIso('2026-01-01'));
    assert.equal(toIso(j.edd), '2026-10-15', '35-day cycle adds 7 days');
    // Day 1 is still day 1: the whole calendar shifts with the due date.
    assert.equal(j.dayNumber, 1 - 7);
  });

  it('pulls the due date in for a shorter cycle', () => {
    const j = computeJourney({ ...base, cycleLength: 21 }, fromIso('2026-01-01'));
    assert.equal(toIso(j.edd), '2026-10-01');
  });

  it('rebuilds the calendar from an ultrasound due date', () => {
    // A dating scan moves the due date a week earlier: every day number and the
    // week the mother is in must move with it.
    const withScan = computeJourney(
      { ...base, eddOverride: '2026-10-01' },
      fromIso('2026-04-12'),
    );
    const withoutScan = computeJourney(base, fromIso('2026-04-12'));

    assert.equal(toIso(withScan.edd), '2026-10-01');
    assert.equal(toIso(withScan.effectiveLmp), '2025-12-25', 'effective LMP = EDD − 280');
    assert.equal(withScan.dayNumber, withoutScan.dayNumber + 7);
    assert.equal(withScan.week, 16);
    assert.equal(withoutScan.week, 15);
  });

  it('never reports negative days remaining past the due date', () => {
    const j = computeJourney(base, fromIso('2026-10-20'));
    assert.equal(j.daysLeft, 0);
    assert.ok(j.dayNumber > 280);
  });

  it('survives a DST transition without dropping a day', () => {
    // Europe/Berlin springs forward on 2026-03-29. Counting across it must still
    // give whole days, which is why diffDays rounds.
    const j = computeJourney({ ...base, lmp: '2026-03-20' }, fromIso('2026-04-03'));
    assert.equal(j.gestationalDay, 14);
    assert.equal(j.gaWeeks, 2);
    assert.equal(j.gaDays, 0);
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
    assert.equal(progressPercent(computeJourney(base, fromIso('2026-01-01'))), 100 / 280);
    assert.equal(progressPercent(computeJourney(base, fromIso('2026-10-20'))), 100);
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
});
