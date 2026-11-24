/**
 * UI chrome strings, Arabic and English.
 *
 * Scope note (spec §22): this covers the app's *chrome* — navigation, screen
 * titles, buttons, empty states. It deliberately does **not** cover the week 4–40
 * medical content in `src/content/pregnancyData.ts`. That copy is reviewed
 * editorial material with named sources; machine-translating it would produce
 * unsourced medical text in a second language, which is exactly what §21 rules
 * out. Translating it is an editorial task with clinical review, not a code one.
 *
 * Arabic is the source of truth. English exists so the switch is ready.
 */

import * as core from './catalog/core';
import * as today from './catalog/today';
import * as records from './catalog/records';
import * as baby from './catalog/baby';

export const STRINGS = {
  ar: { ...core.ar, ...today.ar, ...records.ar, ...baby.ar },
  en: { ...core.en, ...today.en, ...records.en, ...baby.en },
} as const;

export type Locale = keyof typeof STRINGS;
export type StringKey = keyof (typeof STRINGS)['ar'];
