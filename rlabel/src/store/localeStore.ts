import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { zh, en, ja, ko, Locale, LocaleDict } from '../i18n';

interface LocaleState {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: LocaleDict;
}

const dicts: Record<Locale, LocaleDict> = { zh, en, ja, ko };

export const useLocaleStore = create<LocaleState>()(
  persist(
    (set) => ({
      locale: 'zh',
      setLocale: (locale) => set({ locale, t: dicts[locale] }),
      t: zh,
    }),
    {
      name: 'rlabel-locale',
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.t = dicts[state.locale];
        }
      },
    }
  )
);
