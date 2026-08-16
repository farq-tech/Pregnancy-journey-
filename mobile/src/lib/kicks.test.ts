import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  KICK_TARGET,
  averageMinutesToTen,
  compareToBaseline,
  formatElapsed,
  recentDays,
  summarize,
  totalOn,
} from './kicks';
import type { KickSession } from '../store/types';

const session = (over: Partial<KickSession> = {}): KickSession => ({
  id: 'k1',
  date: '2026-08-16',
  startedAt: '2026-08-16T09:00:00.000Z',
  endedAt: '2026-08-16T09:30:00.000Z',
  count: KICK_TARGET,
  note: '',
  ...over,
});

describe('kick sessions', () => {
  it('measures a finished session end to end', () => {
    const summary = summarize(session());
    assert.equal(summary.minutes, 30);
    assert.equal(summary.reachedTarget, true);
    assert.equal(summary.running, false);
  });

  it('measures a running session against now', () => {
    const summary = summarize(
      session({ endedAt: null, count: 3 }),
      new Date('2026-08-16T09:12:00.000Z'),
    );
    assert.equal(summary.minutes, 12);
    assert.equal(summary.running, true);
    assert.equal(summary.reachedTarget, false);
  });

  it('never reports a negative duration when the clock moves backwards', () => {
    const summary = summarize(
      session({ endedAt: null }),
      new Date('2026-08-16T08:00:00.000Z'),
    );
    assert.equal(summary.elapsedMs, 0);
  });

  it('formats elapsed time, adding hours only past the hour', () => {
    assert.equal(formatElapsed(9_000), '00:09');
    assert.equal(formatElapsed(252_000), '04:12');
    assert.equal(formatElapsed(3_852_000), '1:04:12');
  });

  it('totals every session on a day', () => {
    const sessions = [
      session({ id: 'a', count: 10 }),
      session({ id: 'b', count: 6 }),
      session({ id: 'c', date: '2026-08-15', count: 10 }),
    ];
    assert.equal(totalOn(sessions, '2026-08-16'), 16);
    assert.equal(totalOn(sessions, '2026-08-15'), 10);
    assert.equal(totalOn(sessions, '2026-08-14'), 0);
  });
});

describe('her own baseline', () => {
  it('needs two completed sessions before it will state one', () => {
    assert.equal(averageMinutesToTen([session()]), null);
    assert.equal(averageMinutesToTen([]), null);
  });

  it('averages only sessions that finished and reached ten', () => {
    const sessions = [
      session({ id: 'a', startedAt: '2026-08-16T09:00:00.000Z', endedAt: '2026-08-16T09:20:00.000Z' }),
      session({ id: 'b', startedAt: '2026-08-15T09:00:00.000Z', endedAt: '2026-08-15T09:40:00.000Z' }),
      // Abandoned at four — must not drag the average down.
      session({ id: 'c', startedAt: '2026-08-14T09:00:00.000Z', endedAt: '2026-08-14T11:00:00.000Z', count: 4 }),
      // Still running.
      session({ id: 'd', startedAt: '2026-08-13T09:00:00.000Z', endedAt: null }),
    ];
    assert.equal(averageMinutesToTen(sessions), 30);
  });

  it('compares today against that baseline with a tolerance band', () => {
    assert.equal(compareToBaseline(30, null), null);
    assert.equal(compareToBaseline(32, 30), 'similar');
    assert.equal(compareToBaseline(20, 30), 'faster');
    assert.equal(compareToBaseline(45, 30), 'slower');
  });

  it('keeps a floor on the tolerance so short baselines do not flip on noise', () => {
    // 25% of 4 is 1 minute; the floor of 2 keeps 5 vs 4 "similar".
    assert.equal(compareToBaseline(5, 4), 'similar');
    assert.equal(compareToBaseline(8, 4), 'slower');
  });

  it('lists the distinct days that have sessions, newest first', () => {
    const sessions = [
      session({ id: 'a', date: '2026-08-14' }),
      session({ id: 'b', date: '2026-08-16' }),
      session({ id: 'c', date: '2026-08-16' }),
    ];
    assert.deepEqual(recentDays(sessions), ['2026-08-16', '2026-08-14']);
  });
});
