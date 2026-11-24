import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { DEFAULT_LOCALE, setLocale as setModuleLocale, t as translate, type Locale, type StringKey } from './index';

const KEY = 'pj_locale_v1';

type Ctx = {
  locale: Locale;
  rtl: boolean;
  ready: boolean;
  t: (key: StringKey, vars?: Record<string, string | number>) => string;
  setLocale: (locale: Locale) => void;
};

const LocaleContext = createContext<Ctx>({
  locale: DEFAULT_LOCALE,
  rtl: true,
  ready: true,
  t: translate,
  setLocale: () => {},
});

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setState] = useState<Locale>(DEFAULT_LOCALE);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(KEY)
      .then((saved) => {
        if (saved === 'ar' || saved === 'en') {
          setModuleLocale(saved);
          setState(saved);
        }
      })
      .catch(() => {})
      .finally(() => setReady(true));
  }, []);

  const setLocale = useCallback((next: Locale) => {
    setModuleLocale(next);
    setState(next);
    AsyncStorage.setItem(KEY, next).catch(() => {});
  }, []);

  // `t` changes identity with the locale so memoised children pick it up.
  const value = useMemo<Ctx>(
    () => ({ locale, rtl: locale === 'ar', ready, setLocale, t: (k, v) => translate(k, v) }),
    [locale, ready, setLocale],
  );
  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export const useI18n = () => useContext(LocaleContext);
