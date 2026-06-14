import {create} from 'zustand';
import {createJSONStorage, persist} from 'zustand/middleware';

import {appConfig, type AppLanguagePreference} from '@/config';
import {ThemeMode} from '@/theme';
import {syncStringStorage} from '@/services/storage';

interface PreferencesState {
  themeMode: ThemeMode;
  language: AppLanguagePreference;
  setThemeMode: (mode: ThemeMode) => void;
  setLanguage: (language: AppLanguagePreference) => void;
  toggleThemeMode: () => void;
}

export const usePreferencesStore = create<PreferencesState>()(
  persist(
    set => ({
      themeMode: 'system',
      language: appConfig.i18n.defaultLanguage,
      setLanguage: language => set({language}),
      setThemeMode: themeMode => set({themeMode}),
      toggleThemeMode: () =>
        set(state => ({
          themeMode: state.themeMode === 'dark' ? 'light' : 'dark',
        })),
    }),
    {
      name: appConfig.storage.keys.preferencesStore,
      storage: createJSONStorage(() => syncStringStorage),
      partialize: state => ({
        language: state.language,
        themeMode: state.themeMode,
      }),
    },
  ),
);
