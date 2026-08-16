import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { MAX_OCCURRENCES, recurringDates } from './recurrence';
import type { Settings } from './pregnancy';

const settings: Settings = {
  lmp: '2026-07-19',
  cycleLength: 28,
  status: 'pregnant',
  eddOverride: null,
  babyName: '',
  motherName: '',
  doctor: '',
  heightCm: null,
  prePregnancyWeightKg: null,
  partnerName: '',
};

describe('recurring appointments', () => {
  it('produces nothing for a one-off', () => {
    assert.deepEqual(recurringDates('2026-09-01', '', settings), []);
  });

  it('steps weekly, fortnightly and monthly from the first date', () => {
    assert.deepEqual(recurringDates('2026-09-01', 'weekly', settings).slice(0, 3), [
      '2026-09-08',
      '2026-09-15',
      '2026-09-22',
    ]);
    assert.deepEqual(recurringDates('2026-09-01', 'biweekly', settings).slice(0, 2), [
      '2026-09-15',
      '2026-09-29',
    ]);
    assert.deepEqual(recurringDates('2026-09-01', 'monthly', settings).slice(0, 2), [
      '2026-09-29',
      '2026-10-27',
    ]);
  });

  it('excludes the original appointment', () => {
    const dates = recurringDates('2026-09-01', 'weekly', settings);
    assert.ok(!dates.includes('2026-09-01'));
  });

  it('stops at the due date rather than running past the birth', () => {
    // Due date for this LMP is 2027-04-25.
    const dates = recurringDates('2027-04-01', 'weekly', settings);
    assert.ok(dates.length > 0);
    for (const date of dates) assert.ok(date <= '2027-04-25', `${date} is past the due date`);
  });

  it('caps how many rows one save can create', () => {
    const dates = recurringDates('2026-08-01', 'weekly', settings);
    assert.ok(dates.length <= MAX_OCCURRENCES, `${dates.length} exceeds the cap`);
  });

  it('falls back to a full term when there is no profile yet', () => {
    const dates = recurringDates('2026-09-01', 'monthly', null);
    assert.ok(dates.length > 0);
    assert.equal(dates[0], '2026-09-29');
  });
});
