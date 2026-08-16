import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { formatDuration, formatInterval, intervals, patternNote, statsFor } from './contractions';
import type { Contraction } from '../store/types';

/** `count` contractions, `everyMinutes` apart, ending at `endingAt`. */
function series(
  count: number,
  everyMinutes: number,
  durationSeconds: number,
  endingAt: string,
): Contraction[] {
  const end = new Date(endingAt).getTime();
  return Array.from({ length: count }, (_, i) => ({
    id: `c${i}`,
    startedAt: new Date(end - (count - 1 - i) * everyMinutes * 60_000).toISOString(),
    durationSeconds,
    note: '',
  }));
}

const now = new Date('2026-08-16T12:00:00.000Z');

describe('contraction intervals', () => {
  it('measures start to start, not end to start', () => {
    const timed = series(3, 5, 60, '2026-08-16T12:00:00.000Z');
    assert.deepEqual(intervals(timed), [300, 300]);
  });

  it('has no interval to report from a single contraction', () => {
    assert.deepEqual(intervals(series(1, 5, 60, '2026-08-16T12:00:00.000Z')), []);
  });
});

describe('the last hour', () => {
  it('ignores contractions older than the window', () => {
    const stats = statsFor(
      [
        ...series(2, 5, 60, '2026-08-16T09:00:00.000Z'),
        ...series(3, 5, 60, '2026-08-16T12:00:00.000Z'),
      ],
      now,
    );
    assert.equal(stats.countLastHour, 3);
  });

  it('averages duration and frequency over the window', () => {
    const stats = statsFor(series(5, 6, 45, '2026-08-16T12:00:00.000Z'), now);
    assert.equal(stats.averageDurationSeconds, 45);
    assert.equal(stats.averageIntervalSeconds, 360);
    assert.equal(stats.spanMinutes, 24);
  });

  it('reports nothing to average when the window is empty', () => {
    const stats = statsFor([], now);
    assert.equal(stats.countLastHour, 0);
    assert.equal(stats.averageDurationSeconds, null);
    assert.equal(stats.averageIntervalSeconds, null);
    assert.equal(stats.matchesFiveOneOne, false);
  });
});

describe('the 5-1-1 shape', () => {
  it('recognises five minutes apart, a minute long, held for an hour', () => {
    const stats = statsFor(series(13, 5, 65, '2026-08-16T12:00:00.000Z'), now);
    assert.equal(stats.matchesFiveOneOne, true);
    assert.match(patternNote(stats), /5-1-1/);
  });

  it('does not fire on the right frequency held for ten minutes', () => {
    const stats = statsFor(series(3, 5, 65, '2026-08-16T12:00:00.000Z'), now);
    assert.equal(stats.matchesFiveOneOne, false);
  });

  it('does not fire when the contractions are too short', () => {
    const stats = statsFor(series(13, 5, 30, '2026-08-16T12:00:00.000Z'), now);
    assert.equal(stats.matchesFiveOneOne, false);
  });

  it('does not fire when they are too far apart', () => {
    const stats = statsFor(series(5, 15, 65, '2026-08-16T12:00:00.000Z'), now);
    assert.equal(stats.matchesFiveOneOne, false);
  });

  it('describes widely spaced contractions as the practice pattern', () => {
    const stats = statsFor(series(3, 20, 40, '2026-08-16T12:00:00.000Z'), now);
    assert.match(patternNote(stats), /التدريبية/);
  });
});

describe('formatting', () => {
  it('reads a duration as minutes and seconds', () => {
    assert.equal(formatDuration(65), '1:05');
    assert.equal(formatDuration(9), '0:09');
  });

  it('switches from seconds to minutes for the interval', () => {
    assert.equal(formatInterval(null), '—');
    assert.equal(formatInterval(45), 'كل 45 ثانية');
    assert.equal(formatInterval(300), 'كل 5 دقائق');
    assert.equal(formatInterval(120), 'كل دقيقتين');
  });
});
