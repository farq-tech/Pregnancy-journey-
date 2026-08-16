import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { bloodPressureFlag, flagFor, latestOfKind, ofKind } from './vitals';
import type { Measurement } from '../store/types';

const reading = (over: Partial<Measurement> = {}): Measurement => ({
  id: 'm1',
  date: '2026-08-16',
  kind: 'bp',
  value: 118,
  value2: 74,
  context: '',
  notes: '',
  ...over,
});

describe('blood pressure against the published thresholds', () => {
  it('says nothing about a reading that crosses nothing', () => {
    assert.equal(bloodPressureFlag(118, 74), null);
  });

  it('flags 140/90 as the level that gets reported to a clinician', () => {
    assert.equal(bloodPressureFlag(140, 85)?.level, 'attention');
    assert.equal(bloodPressureFlag(130, 90)?.level, 'attention');
  });

  it('escalates at 160/110', () => {
    assert.equal(bloodPressureFlag(162, 92)?.level, 'urgent');
    assert.equal(bloodPressureFlag(150, 112)?.level, 'urgent');
  });

  it('takes either half crossing the line, not both', () => {
    assert.equal(bloodPressureFlag(90, 95)?.level, 'attention');
  });

  it('notes a low reading without alarming about it', () => {
    assert.equal(bloodPressureFlag(85, 55)?.level, 'info');
    // One half low is not a low reading.
    assert.equal(bloodPressureFlag(85, 70), null);
  });
});

describe('flags on stored measurements', () => {
  it('only ever flags blood pressure', () => {
    assert.equal(flagFor(reading({ kind: 'glucose', value: 190, value2: null })), null);
    assert.equal(flagFor(reading({ kind: 'weight', value: 200, value2: null })), null);
    assert.equal(flagFor(reading({ value: 145, value2: 95 }))?.level, 'attention');
  });

  it('cannot flag a blood-pressure row that lost its diastolic half', () => {
    assert.equal(flagFor(reading({ value: 145, value2: null })), null);
  });
});

describe('selecting readings', () => {
  const all = [
    reading({ id: 'a', kind: 'weight', value: 62, value2: null, date: '2026-08-10' }),
    reading({ id: 'b', kind: 'weight', value: 63, value2: null, date: '2026-08-16' }),
    reading({ id: 'c', kind: 'glucose', value: 95, value2: null, date: '2026-08-12' }),
  ];

  it('filters by kind, newest first', () => {
    assert.deepEqual(
      ofKind(all, 'weight').map((m) => m.id),
      ['b', 'a'],
    );
  });

  it('takes the most recent of a kind', () => {
    assert.equal(latestOfKind(all, 'weight')?.id, 'b');
    assert.equal(latestOfKind(all, 'bp'), null);
  });
});
