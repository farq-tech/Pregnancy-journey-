/**
 * القياسات — blood pressure and blood sugar readings.
 *
 * The line this file walks: recording a reading is hers, interpreting it is her
 * clinician's. So there is exactly one thing here that resembles a judgement,
 * and it is deliberate — blood pressure at or above 140/90 in pregnancy is the
 * threshold ACOG describes for hypertensive disorders, and 160/110 is the one
 * described as needing urgent attention. Knowing that a reading crosses a
 * published line is precisely the knowledge that gets a mother seen in time for
 * pre-eclampsia, and withholding it would be the less safe choice.
 *
 * Every flag therefore does the same two things: names the published threshold,
 * and points at her clinician. None of them diagnoses anything.
 *
 * Blood sugar is deliberately **not** interpreted. The target ranges differ by
 * country, by protocol, and by whether she has been diagnosed with gestational
 * diabetes — a number here would be wrong for someone.
 */

import type { Measurement } from '../store/types';

export type VitalFlag = {
  level: 'info' | 'attention' | 'urgent';
  message: string;
};

/** Published thresholds (ACOG), used only to tell her a reading crossed one. */
export const BP_THRESHOLDS = {
  low: { systolic: 90, diastolic: 60 },
  raised: { systolic: 140, diastolic: 90 },
  severe: { systolic: 160, diastolic: 110 },
} as const;

/**
 * Classifies a blood-pressure reading against those thresholds.
 * Returns `null` for a reading that crosses nothing.
 */
export function bloodPressureFlag(systolic: number, diastolic: number): VitalFlag | null {
  if (systolic >= BP_THRESHOLDS.severe.systolic || diastolic >= BP_THRESHOLDS.severe.diastolic) {
    return {
      level: 'urgent',
      message:
        'القراءة عند أو فوق 160/110 — وهو الحد الذي تصفه الإرشادات بأنه يستدعي تواصلًا عاجلًا مع الطبيب أو الطوارئ. أعيدي القياس بعد راحة قصيرة، وتواصلي الآن.',
    };
  }
  if (systolic >= BP_THRESHOLDS.raised.systolic || diastolic >= BP_THRESHOLDS.raised.diastolic) {
    return {
      level: 'attention',
      message:
        'القراءة عند أو فوق 140/90 — الحد الذي تُبنى عليه متابعة ضغط الحمل. قراءة واحدة لا تعني تشخيصًا؛ أعيدي القياس بعد راحة، وأبلغي طبيبك بالقراءتين.',
    };
  }
  if (systolic < BP_THRESHOLDS.low.systolic && diastolic < BP_THRESHOLDS.low.diastolic) {
    return {
      level: 'info',
      message:
        'قراءة منخفضة نسبيًا. انخفاض الضغط شائع في الحمل وخصوصًا في الثلث الثاني؛ اذكريه لطبيبك إذا صاحبه دوخة أو إغماء.',
    };
  }
  return null;
}

/** The flag for a stored measurement, if it has one. */
export function flagFor(measurement: Measurement): VitalFlag | null {
  if (measurement.kind !== 'bp' || measurement.value2 === null) return null;
  return bloodPressureFlag(measurement.value, measurement.value2);
}

/** Named contexts for a glucose reading — recorded, never scored. */
export const GLUCOSE_CONTEXTS = [
  { value: 'fasting', label: 'صائمة' },
  { value: 'after-meal-1', label: 'بعد ساعة من الأكل' },
  { value: 'after-meal-2', label: 'بعد ساعتين من الأكل' },
  { value: 'random', label: 'عشوائي' },
] as const;

export function glucoseContextLabel(value: string): string {
  return GLUCOSE_CONTEXTS.find((c) => c.value === value)?.label ?? value;
}

export const GLUCOSE_NOTE =
  'الحدود المرجعية لسكر الحمل تختلف بحسب البلد والبروتوكول وحالتك — التطبيق يسجّل القراءة فقط، وتفسيرها يعود لطبيبك.';

/** Measurements of one kind, newest first. */
export function ofKind(
  measurements: readonly Measurement[],
  kind: Measurement['kind'],
): Measurement[] {
  return measurements
    .filter((m) => m.kind === kind)
    .sort((a, b) => b.date.localeCompare(a.date));
}

export function latestOfKind(
  measurements: readonly Measurement[],
  kind: Measurement['kind'],
): Measurement | null {
  return ofKind(measurements, kind)[0] ?? null;
}
