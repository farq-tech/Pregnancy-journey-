/**
 * Translation lookup.
 *
 * Arabic is the default and the source of truth; English is picked up only when
 * the device is set to English. The medical content stays Arabic regardless —
 * see the note in `strings.ts`.
 */

import { getLocales } from 'expo-localization';

import { STRINGS, type Locale, type StringKey } from './strings';

export const DEFAULT_LOCALE: Locale = 'ar';

function detectLocale(): Locale {
  try {
    const code = getLocales()[0]?.languageCode;
    return code === 'en' ? 'en' : DEFAULT_LOCALE;
  } catch {
    // getLocales can throw on a misconfigured device; Arabic is the safe default.
    return DEFAULT_LOCALE;
  }
}

let activeLocale: Locale = detectLocale();

export function getLocale(): Locale {
  return activeLocale;
}

/**
 * Overrides the device locale. Exposed for a future in-app language switch and
 * for tests; changing it does not re-render on its own.
 */
export function setLocale(locale: Locale): void {
  activeLocale = locale;
}

/** True when the active locale reads right to left. */
export function isRtl(): boolean {
  return activeLocale === 'ar';
}

/** Looks up a chrome string. Falls back to Arabic, then to the key itself. */
export function t(key: StringKey): string {
  return STRINGS[activeLocale][key] ?? STRINGS[DEFAULT_LOCALE][key] ?? key;
}

export type { Locale, StringKey };
