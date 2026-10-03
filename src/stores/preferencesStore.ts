import {create} from 'zustand';
import {createJSONStorage, persist} from 'zustand/middleware';

import {appConfig, type AppLanguagePreference} from '@/config';
import {ThemeMode} from '@/theme';
import {syncStringStorage} from '@/services/storage';
import {logger} from '@/utils/logger';

interface PreferencesState {
  themeMode: ThemeMode;
  language: AppLanguagePreference;
  setThemeMode: (mode: ThemeMode) => void;
  setLanguage: (language: AppLanguagePreference) => void;
  toggleThemeMode: () => void;
  resetPreferences: () => void;
}

const defaults = {
  themeMode: 'system' as ThemeMode,
  language: appConfig.i18n.defaultLanguage as AppLanguagePreference,
};

const readPreferences = (persisted: unknown) => {
  const values =
    persisted && typeof persisted === 'object'
      ? (persisted as Record<string, unknown>)
      : {};
  return {
    themeMode:
      values.themeMode === 'light' ||
      values.themeMode === 'dark' ||
      values.themeMode === 'system'
        ? values.themeMode
        : defaults.themeMode,
    language: appConfig.i18n.languagePreferences.includes(
      values.language as AppLanguagePreference,
    )
      ? (values.language as AppLanguagePreference)
      : defaults.language,
  };
};

export const usePreferencesStore = create<PreferencesState>()(
  persist(
    set => ({
      ...defaults,
      setLanguage: language => set({language}),
      setThemeMode: themeMode => set({themeMode}),
      toggleThemeMode: () =>
        set(state => ({
          themeMode: state.themeMode === 'dark' ? 'light' : 'dark',
        })),
      resetPreferences: () => set(defaults),
    }),
    {
      name: appConfig.storage.keys.preferencesStore,
      version: 1,
      storage: createJSONStorage(() => syncStringStorage),
      partialize: state => ({
        language: state.language,
        themeMode: state.themeMode,
      }),
      migrate: persisted => readPreferences(persisted),
      merge: (persisted, current) => ({
        ...current,
        ...readPreferences(persisted),
      }),
      onRehydrateStorage: () => (_state, error) => {
        if (error) {
          logger.warn('[preferences] could not restore preferences', error);
        }
      },
    },
  ),
);
