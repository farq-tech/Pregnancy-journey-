/**
 * "أسئلة للطبيب" — prompts to take to an antenatal visit (spec §5).
 *
 * These are deliberately *questions*, never statements. They are derived from
 * the week's own test window and milestones plus a short trimester-level list,
 * so the app is never asserting a medical fact it cannot source — it is helping
 * her ask her clinician, who can.
 */

import { MILESTONES, TESTS } from './pregnancyData';
import { trimesterFor } from '../lib/pregnancy';

/** Applies across a whole trimester; phrased as openers, not checklists. */
const BY_TRIMESTER: Record<1 | 2 | 3, readonly string[]> = {
  1: [
    'ما الفيتامينات أو المكمّلات المناسبة لحالتي؟',
    'هل هناك أدوية أستخدمها حاليًا تحتاج مراجعة؟',
    'ما الأعراض التي تستدعي التواصل معك فورًا؟',
    'متى موعد الزيارة القادمة، وما الذي سيتم فيها؟',
  ],
  2: [
    'هل نتائج الفحوصات حتى الآن ضمن المتوقع؟',
    'ما مستوى النشاط البدني المناسب لي؟',
    'ما الذي يجب أن أنتبه له في حركة الجنين؟',
    'هل هناك تطعيمات يُنصح بها في هذه المرحلة؟',
  ],
  3: [
    'ما علامات المخاض التي يجب أن أعرفها؟',
    'متى يجب أن أتوجه للمستشفى؟',
    'ما خيارات الولادة المتاحة في حالتي؟',
    'كيف أتابع حركة الجنين يوميًا؟',
    'ما الخطة إذا تجاوز الحمل الموعد المتوقع؟',
  ],
};

/**
 * Questions for a given gestational week: the trimester list, plus one per test
 * whose usual window is open and one per milestone falling in the week.
 */
export function questionsForWeek(week: number): string[] {
  // Week 1 starts at gestational day 0.
  const trimester = trimesterFor((week - 1) * 7);
  const questions = [...BY_TRIMESTER[trimester]];

  for (const test of TESTS) {
    if (week >= test.from && week <= test.to) {
      questions.push(`هل ${test.name} مناسب لحالتي، ومتى يُفضَّل إجراؤه؟`);
    }
  }

  for (const milestone of MILESTONES) {
    if (milestone.week === week && !milestone.auto) {
      questions.push(`بخصوص "${milestone.label}" — ما المتوقع في حالتي؟`);
    }
  }

  return questions;
}
