import {create} from 'zustand';
import {createJSONStorage, persist} from 'zustand/middleware';

import {appConfig} from '@/config';
import {ThemeMode} from '@/theme';
import {syncStringStorage} from '@/services/storage';

interface PreferencesState {
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
  toggleThemeMode: () => void;
}

export const usePreferencesStore = create<PreferencesState>()(
  persist(
    set => ({
      themeMode: 'system',
      setThemeMode: themeMode => set({themeMode}),
      toggleThemeMode: () =>
        set(state => ({
          themeMode: state.themeMode === 'dark' ? 'light' : 'dark',
        })),
    }),
    {
      name: appConfig.storage.keys.preferencesStore,
      storage: createJSONStorage(() => syncStringStorage),
      partialize: state => ({themeMode: state.themeMode}),
    },
  ),
);
