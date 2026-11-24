import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { fromIso } from '../lib/dates';
import type { Appointment, MedicalRecord } from '../store/types';
import { milestonesWithState } from './milestones';

const effectiveLmp = fromIso('2026-07-19');

const scan = (date: string): MedicalRecord => ({
  id: `scan-${date}`,
  type: 'ultrasound',
  title: 'سونار',
  date,
  provider: '',
  notes: '',
  crl: '',
  fhr: '',
  newEdd: null,
  scanGaDays: null,
});

const visit = (date: string, done: boolean): Appointment => ({
  id: `visit-${date}`,
  title: 'زيارة',
  type: 'doctor',
  date,
  time: '',
  location: '',
  doctor: '',
  notes: '',
  reminder: '',
  done,
  recurrence: '',
});

const find = (states: ReturnType<typeof milestonesWithState>, id: string) => {
  const found = states.find((m) => m.id === id);
  assert.ok(found, `milestone ${id} missing`);
  return found;
};

describe('milestone confirmation', () => {
  // 10w0d — past the week-6 cardiac-activity window, before the week-20 scan.
  const gestationalDay = 10 * 7;

  it('never claims a heartbeat from the calendar alone', () => {
    const states = milestonesWithState(gestationalDay, effectiveLmp, [], []);
    const heart = find(states, 'heart');
    assert.equal(heart.state.status, 'expected');
    assert.match(heart.state.label, /يؤكده الطبيب/);
    assert.notEqual(heart.state.status, 'confirmed');
  });

  it('never confirms a heartbeat from a scan record alone — it only points to the report', () => {
    // A scan on file says nothing about its findings (it may have shown no heartbeat).
    const states = milestonesWithState(gestationalDay, effectiveLmp, [scan('2026-09-05')], []);
    assert.equal(find(states, 'heart').state.status, 'expected');
    assert.match(find(states, 'heart').state.label, /راجعي نتيجته/);
  });

  it('does not let an early scan confirm a later milestone', () => {
    // A week-6 scan must not tick off the week-20 anatomy scan, even once the
    // calendar has reached week 20.
    const atWeek21 = 20 * 7;
    const states = milestonesWithState(atWeek21, effectiveLmp, [scan('2026-09-05')], []);
    assert.match(find(states, 'heart').state.label, /راجعي نتيجته/);
    assert.match(find(states, 'anatomy').state.label, /يؤكده الطبيب/);
  });

  it('treats gestational-age milestones as reached when the date arrives', () => {
    const atWeek38 = 37 * 7;
    const states = milestonesWithState(atWeek38, effectiveLmp, [], []);
    assert.equal(find(states, 'w37').state.status, 'confirmed');
    assert.equal(find(states, 't1-done').state.status, 'confirmed');
    assert.equal(find(states, 'w40').state.status, 'upcoming');
  });

  it('confirms the first visit only from an attended appointment', () => {
    const pending = milestonesWithState(gestationalDay, effectiveLmp, [], [
      visit('2026-09-20', false),
    ]);
    assert.equal(find(pending, 'first-visit').state.status, 'expected');

    const attended = milestonesWithState(gestationalDay, effectiveLmp, [], [
      visit('2026-09-20', true),
    ]);
    assert.equal(find(attended, 'first-visit').state.status, 'confirmed');
  });

  it('leaves self-reported milestones as possibilities, never assertions', () => {
    const atWeek21 = 20 * 7;
    const states = milestonesWithState(atWeek21, effectiveLmp, [scan('2027-01-01')], []);
    const movement = find(states, 'movement');
    assert.equal(movement.state.status, 'expected');
    assert.match(movement.state.label, /تختلف بين النساء/);
  });

  it('counts down to milestones that are still ahead', () => {
    const states = milestonesWithState(0, effectiveLmp, [], []);
    const anatomy = find(states, 'anatomy');
    assert.equal(anatomy.state.status, 'upcoming');
    assert.match(anatomy.state.label, /^باقي /);
  });
});
