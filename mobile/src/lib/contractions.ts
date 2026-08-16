/**
 * مؤقّت الانقباضات — timing contractions.
 *
 * Two numbers matter and they are easy to confuse under stress, which is
 * exactly why an app should compute them: **duration** (how long one
 * contraction lasts) and **frequency** (start of one to the start of the next,
 * not end-to-start).
 *
 * The "5-1-1" shape — contractions about five minutes apart, lasting about a
 * minute, holding that way for about an hour — is the pattern many clinicians
 * describe when explaining when to be in touch. This module can recognise that
 * shape, and says so as *information about the pattern*, never as an
 * instruction: the threshold for any individual pregnancy is set by her own
 * clinician, and anything urgent (bleeding, waters breaking, reduced movement)
 * is a reason to call regardless of what a timer says.
 */

import { minutes, seconds } from './arabic';
import type { Contraction } from '../store/types';

/** Contractions started within this window count towards the live pattern. */
const PATTERN_WINDOW_MS = 60 * 60 * 1000;

export const FIVE_ONE_ONE = {
  intervalMinutes: 5,
  durationSeconds: 60,
  sustainedMinutes: 60,
} as const;

export type ContractionStats = {
  /** Contractions started in the last hour. */
  countLastHour: number;
  /** Mean duration in seconds over the window, or null with nothing to average. */
  averageDurationSeconds: number | null;
  /** Mean start-to-start gap in seconds, or null with fewer than two. */
  averageIntervalSeconds: number | null;
  /** Minutes from the first to the last contraction in the window. */
  spanMinutes: number;
  /** True when the window matches the 5-1-1 shape described above. */
  matchesFiveOneOne: boolean;
};

/** Start-to-start gaps, oldest pair first, in seconds. */
export function intervals(contractions: readonly Contraction[]): number[] {
  const sorted = [...contractions].sort((a, b) => a.startedAt.localeCompare(b.startedAt));
  const out: number[] = [];
  for (let i = 1; i < sorted.length; i += 1) {
    const gap =
      (new Date(sorted[i].startedAt).getTime() - new Date(sorted[i - 1].startedAt).getTime()) /
      1000;
    if (gap > 0) out.push(Math.round(gap));
  }
  return out;
}

export function statsFor(
  contractions: readonly Contraction[],
  now: Date = new Date(),
): ContractionStats {
  const cutoff = now.getTime() - PATTERN_WINDOW_MS;
  const window = contractions
    .filter((c) => new Date(c.startedAt).getTime() >= cutoff)
    .sort((a, b) => a.startedAt.localeCompare(b.startedAt));

  const gaps = intervals(window);
  const averageDurationSeconds = window.length
    ? Math.round(window.reduce((sum, c) => sum + c.durationSeconds, 0) / window.length)
    : null;
  const averageIntervalSeconds = gaps.length
    ? Math.round(gaps.reduce((sum, gap) => sum + gap, 0) / gaps.length)
    : null;

  const spanMinutes = window.length
    ? Math.round(
        (new Date(window[window.length - 1].startedAt).getTime() -
          new Date(window[0].startedAt).getTime()) /
          60_000,
      )
    : 0;

  // The pattern needs all three parts: close enough together, long enough, and
  // held long enough. Requiring the span rules out a handful of contractions in
  // ten minutes reading as an hour-long pattern.
  const matchesFiveOneOne =
    averageIntervalSeconds !== null &&
    averageDurationSeconds !== null &&
    averageIntervalSeconds <= FIVE_ONE_ONE.intervalMinutes * 60 &&
    averageDurationSeconds >= FIVE_ONE_ONE.durationSeconds &&
    spanMinutes >= FIVE_ONE_ONE.sustainedMinutes - 5;

  return {
    countLastHour: window.length,
    averageDurationSeconds,
    averageIntervalSeconds,
    spanMinutes,
    matchesFiveOneOne,
  };
}

/** `1:05` — minutes and seconds, the way a contraction is read out loud. */
export function formatDuration(seconds: number): string {
  const total = Math.max(0, Math.round(seconds));
  const minutes = Math.floor(total / 60);
  const rest = total % 60;
  return `${minutes}:${rest < 10 ? `0${rest}` : rest}`;
}

/** `كل 4 دقائق` / `كل 45 ثانية` */
export function formatInterval(intervalSeconds: number | null): string {
  if (intervalSeconds === null) return '—';
  if (intervalSeconds < 90) return `كل ${seconds(Math.round(intervalSeconds))}`;
  const mins = Math.round(intervalSeconds / 60);
  // "كل دقيقة واحدة" reads wrong; the bare noun is what a person would say.
  if (mins === 1) return 'كل دقيقة';
  if (mins === 2) return 'كل دقيقتين';
  return `كل ${minutes(mins)}`;
}

/**
 * A description of the current pattern, in her language. Descriptive by design:
 * "النمط يشبه…", never "اذهبي إلى المستشفى".
 */
export function patternNote(stats: ContractionStats): string {
  if (stats.countLastHour === 0) return 'لا انقباضات مسجّلة في الساعة الأخيرة.';
  if (stats.countLastHour === 1) return 'انقباضة واحدة في الساعة الأخيرة — سجّلي التالية لبناء النمط.';
  if (stats.matchesFiveOneOne) {
    return 'النمط المسجّل يقترب من الشكل الذي يصفه كثير من الأطباء بـ 5-1-1 (كل خمس دقائق، بطول دقيقة، لمدة ساعة). هذا وقت مناسب للتواصل مع طبيبك.';
  }
  if (stats.averageIntervalSeconds !== null && stats.averageIntervalSeconds > 15 * 60) {
    return 'الانقباضات متباعدة وغير منتظمة حتى الآن — كثيرًا ما يكون هذا شكل الانقباضات التدريبية.';
  }
  return 'النمط يتشكّل — واصلي التسجيل، والفارق بين انقباضات المخاض والتدريبية أنها تنتظم وتقترب وتزداد قوة.';
}
