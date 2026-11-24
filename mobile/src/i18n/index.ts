/**
 * Translation lookup.
 *
 * Arabic is the default and the source of truth. The language is chosen in the
 * app (see LocaleProvider) and persisted; the device language is deliberately
 * not used, so existing Arabic users never get a surprise English UI.
 * The medical content stays Arabic — see the note in `strings.ts`.
 */

import { STRINGS, type Locale, type StringKey } from './strings';

export const DEFAULT_LOCALE: Locale = 'ar';

let activeLocale: Locale = DEFAULT_LOCALE;

export function getLocale(): Locale {
  return activeLocale;
}

/** Module-level switch; LocaleProvider owns re-rendering. */
export function setLocale(locale: Locale): void {
  activeLocale = locale;
}

/** True when the active locale reads right to left. */
export function isRtl(): boolean {
  return activeLocale === 'ar';
}

/** Looks up a string, filling `{name}` placeholders. Falls back to Arabic, then the key. */
export function t(key: StringKey, vars?: Record<string, string | number>): string {
  const raw = STRINGS[activeLocale][key] ?? STRINGS[DEFAULT_LOCALE][key] ?? key;
  return vars ? raw.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? '')) : raw;
}

export type { Locale, StringKey };
