/**
 * Contraction timing. The 5-1-1 rule is a *common labour hint*, not a
 * diagnosis: contractions about 5 minutes apart, lasting about 1 minute,
 * for about 1 hour. The app never tells her she is in labour.
 */

export type Contraction = {
  /** Epoch ms when the wave started. */
  start: number;
  /** Epoch ms when she marked it finished. Null while it is still running. */
  end: number | null;
};

export function durationMs(contraction: Contraction, now = Date.now()): number {
  return (contraction.end ?? now) - contraction.start;
}

/** Start-to-start gap between two neighbouring contractions. */
export function intervalMs(earlier: Contraction, later: Contraction): number {
  return later.start - earlier.start;
}

export type FiveOneOne = {
  /** True when the last hour looks like the 5-1-1 pattern. */
  matches: boolean;
  counted: number;
  averageDurationSec: number | null;
  averageIntervalSec: number | null;
};

const HOUR_MS = 60 * 60 * 1000;
const TARGET_DURATION_MS = 50 * 1000;
const TARGET_INTERVAL_MS = 5.5 * 60 * 1000;
const MIN_COUNT = 10;

/**
 * Looks at completed contractions whose start falls in the last hour.
 * Thresholds are slightly looser than a textbook 60s / 5min so a real
 * pattern still surfaces if she is a few seconds off.
 */
export function evaluateFiveOneOne(
  contractions: readonly Contraction[],
  now = Date.now(),
): FiveOneOne {
  const windowStart = now - HOUR_MS;
  const recent = contractions
    .filter((c) => c.end != null && c.start >= windowStart && c.start <= now)
    .sort((a, b) => a.start - b.start);

  if (recent.length < 2) {
    return { matches: false, counted: recent.length, averageDurationSec: null, averageIntervalSec: null };
  }

  const durations = recent.map((c) => durationMs(c, now));
  const intervals = recent.slice(1).map((c, i) => intervalMs(recent[i]!, c));
  const averageDurationSec = average(durations) / 1000;
  const averageIntervalSec = average(intervals) / 1000;
  const longEnough = durations.filter((d) => d >= TARGET_DURATION_MS).length >= MIN_COUNT;
  const closeEnough = intervals.filter((i) => i > 0 && i <= TARGET_INTERVAL_MS).length >= MIN_COUNT - 1;
  const matches = recent.length >= MIN_COUNT && longEnough && closeEnough;

  return { matches, counted: recent.length, averageDurationSec, averageIntervalSec };
}

function average(values: number[]): number {
  return values.reduce((sum, n) => sum + n, 0) / values.length;
}

export const FIVE_ONE_ONE_HINT =
  'قاعدة 5-1-1 الشائعة: تقلصات كل 5 دقائق تقريبًا، تدوم دقيقة، لمدة ساعة. هذا توجيه للسؤال — ليس تشخيصًا. اتصلي بطبيبتك أو توجهي للمستشفى إذا نصحكِ بذلك، أو إذا سال سائل أو ظهر نزيف أو قلّت حركة الجنين.';
