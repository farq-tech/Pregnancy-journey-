/**
 * متابعة الوزن — gestational weight gain against a published range.
 *
 * The ranges are the Institute of Medicine (2009) recommendations for a
 * singleton pregnancy, which ACOG reiterates: a total gain band keyed to
 * pre-pregnancy BMI, made of a small first-trimester allowance plus a weekly
 * rate through the second and third.
 *
 * Two limits are stated wherever this is rendered, and they are not decoration:
 *   - the ranges are for a **singleton** pregnancy; twins have their own bands,
 *   - and an individual target is set by her clinician, who knows the rest of
 *     her history. The app shows where she sits against a published band; it
 *     does not tell her what to weigh.
 */

export type BmiCategory = 'underweight' | 'normal' | 'overweight' | 'obese';

export const BMI_CATEGORY_LABELS: Record<BmiCategory, string> = {
  underweight: 'أقل من الوزن الطبيعي',
  normal: 'وزن طبيعي',
  overweight: 'زيادة في الوزن',
  obese: 'سمنة',
};

/** Total gain over the whole pregnancy, in kilograms (IOM 2009, singleton). */
const TOTAL_GAIN: Record<BmiCategory, { min: number; max: number }> = {
  underweight: { min: 12.5, max: 18 },
  normal: { min: 11.5, max: 16 },
  overweight: { min: 7, max: 11.5 },
  obese: { min: 5, max: 9 },
};

/** Weekly rate through the second and third trimesters, in kilograms. */
const WEEKLY_RATE: Record<BmiCategory, { min: number; max: number }> = {
  underweight: { min: 0.44, max: 0.58 },
  normal: { min: 0.35, max: 0.5 },
  overweight: { min: 0.23, max: 0.33 },
  obese: { min: 0.17, max: 0.27 },
};

/** First-trimester allowance, the same for every category (IOM 2009). */
const FIRST_TRIMESTER_GAIN = { min: 0.5, max: 2 } as const;

/** Week the weekly rate starts applying — the second trimester. */
const RATE_FROM_WEEK = 14;

export type GainRange = { min: number; max: number };

export function bmi(weightKg: number, heightCm: number): number | null {
  if (!(weightKg > 0) || !(heightCm > 0)) return null;
  const metres = heightCm / 100;
  return weightKg / (metres * metres);
}

export function bmiCategory(value: number): BmiCategory {
  if (value < 18.5) return 'underweight';
  if (value < 25) return 'normal';
  if (value < 30) return 'overweight';
  return 'obese';
}

/** Total recommended gain for the whole pregnancy. */
export function totalRange(category: BmiCategory): GainRange {
  return TOTAL_GAIN[category];
}

/**
 * The band she would be expected to sit in *by this week*: the first-trimester
 * allowance, plus the weekly rate for every week since week 14. Clamped to the
 * published total so a post-term week cannot push the band past it.
 */
export function expectedRangeAtWeek(category: BmiCategory, week: number): GainRange {
  if (week <= RATE_FROM_WEEK) {
    // Ramp the first-trimester allowance in rather than showing the full 2 kg
    // from week four, which would read as a target from day one.
    const share = Math.min(1, Math.max(0, (week - 4) / (RATE_FROM_WEEK - 4)));
    return {
      min: round1(FIRST_TRIMESTER_GAIN.min * share),
      max: round1(FIRST_TRIMESTER_GAIN.max * share),
    };
  }

  const weeksAtRate = week - RATE_FROM_WEEK;
  const rate = WEEKLY_RATE[category];
  const total = TOTAL_GAIN[category];
  return {
    min: round1(Math.min(total.min, FIRST_TRIMESTER_GAIN.min + rate.min * weeksAtRate)),
    max: round1(Math.min(total.max, FIRST_TRIMESTER_GAIN.max + rate.max * weeksAtRate)),
  };
}

export type GainPosition = 'below' | 'within' | 'above';

export function positionIn(gainKg: number, range: GainRange): GainPosition {
  if (gainKg < range.min) return 'below';
  if (gainKg > range.max) return 'above';
  return 'within';
}

export const GAIN_POSITION_LABELS: Record<GainPosition, string> = {
  below: 'أقل من النطاق المنشور لهذا الأسبوع',
  within: 'ضمن النطاق المنشور لهذا الأسبوع',
  above: 'أعلى من النطاق المنشور لهذا الأسبوع',
};

export type WeightPicture = {
  category: BmiCategory;
  bmi: number;
  gainKg: number;
  range: GainRange;
  total: GainRange;
  position: GainPosition;
};

/**
 * The whole picture, or `null` when the inputs for it are missing — height and
 * pre-pregnancy weight are optional in onboarding, and the screen degrades to a
 * plain trend line without them.
 */
export function weightPicture(
  latestWeightKg: number | null,
  prePregnancyWeightKg: number | null,
  heightCm: number | null,
  week: number,
): WeightPicture | null {
  if (latestWeightKg === null || prePregnancyWeightKg === null || heightCm === null) return null;
  const value = bmi(prePregnancyWeightKg, heightCm);
  if (value === null) return null;

  const category = bmiCategory(value);
  const gainKg = round1(latestWeightKg - prePregnancyWeightKg);
  const range = expectedRangeAtWeek(category, week);

  return {
    category,
    bmi: round1(value),
    gainKg,
    range,
    total: totalRange(category),
    position: positionIn(gainKg, range),
  };
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}
