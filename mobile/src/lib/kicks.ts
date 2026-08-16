/**
 * عدّاد الركلات — counting fetal movements.
 *
 * The clinical framing this module is careful to preserve: what matters is
 * *her own baby's pattern*, not a universal number. ACOG and NHS both describe
 * "count to ten" as a widely used approach — she picks an active time of day,
 * counts distinct movements, and notes how long ten took. A change from her own
 * usual pattern is what she is asked to report, and no app is in a position to
 * decide that for her.
 *
 * So this file computes: how long a session ran, whether it reached ten, and
 * how today compares to her own recent average. It never says "normal".
 */

import { toIso, type IsoDate } from './dates';
import type { KickSession } from '../store/types';

/** The count "count to ten" counts to. */
export const KICK_TARGET = 10;

/** Below the third trimester the app suggests rather than tracks. */
export const KICK_TRACKING_FROM_WEEK = 28;

export type KickSessionSummary = {
  /** Milliseconds from start to end, or to `now` while it is still running. */
  elapsedMs: number;
  minutes: number;
  reachedTarget: boolean;
  running: boolean;
};

export function summarize(session: KickSession, now: Date = new Date()): KickSessionSummary {
  const start = new Date(session.startedAt).getTime();
  const end = session.endedAt ? new Date(session.endedAt).getTime() : now.getTime();
  // A clock that went backwards (timezone change, manual adjustment) must not
  // produce a negative duration.
  const elapsedMs = Math.max(0, end - start);
  return {
    elapsedMs,
    minutes: Math.floor(elapsedMs / 60_000),
    reachedTarget: session.count >= KICK_TARGET,
    running: !session.endedAt,
  };
}

/** `1:04:12` past an hour, `04:12` below it. */
export function formatElapsed(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;
  const pad = (n: number) => (n < 10 ? `0${n}` : String(n));
  return hours ? `${hours}:${pad(minutes)}:${pad(seconds)}` : `${pad(minutes)}:${pad(seconds)}`;
}

export function sessionsOn(sessions: readonly KickSession[], date: IsoDate): KickSession[] {
  return sessions.filter((session) => session.date === date);
}

/** Total movements counted on a day, across every session. */
export function totalOn(sessions: readonly KickSession[], date: IsoDate): number {
  return sessionsOn(sessions, date).reduce((sum, session) => sum + session.count, 0);
}

/**
 * Her own baseline: the average minutes taken to reach ten, over the most
 * recent completed sessions that got there. `null` until there are at least two
 * — one session is an anecdote, not a pattern.
 */
export function averageMinutesToTen(
  sessions: readonly KickSession[],
  sample = 7,
): number | null {
  const completed = sessions
    .filter((session) => session.endedAt && session.count >= KICK_TARGET)
    .sort((a, b) => b.startedAt.localeCompare(a.startedAt))
    .slice(0, sample);

  if (completed.length < 2) return null;
  const total = completed.reduce((sum, session) => sum + summarize(session).minutes, 0);
  return Math.round(total / completed.length);
}

/**
 * How today's session compares to her own average — the only comparison this
 * app is entitled to make. Returns `null` when there is no baseline yet.
 */
export function compareToBaseline(
  minutes: number,
  baseline: number | null,
): 'faster' | 'similar' | 'slower' | null {
  if (baseline === null) return null;
  // A quarter of the baseline, with a two-minute floor so short baselines do
  // not flip category on noise.
  const tolerance = Math.max(2, Math.round(baseline * 0.25));
  if (minutes < baseline - tolerance) return 'faster';
  if (minutes > baseline + tolerance) return 'slower';
  return 'similar';
}

/** Days, most recent first, that have at least one session. */
export function recentDays(sessions: readonly KickSession[], limit = 14): IsoDate[] {
  const seen = new Set<IsoDate>();
  for (const session of [...sessions].sort((a, b) => b.date.localeCompare(a.date))) {
    seen.add(session.date);
    if (seen.size >= limit) break;
  }
  return [...seen];
}

export function todayIso(now: Date = new Date()): IsoDate {
  return toIso(now);
}
