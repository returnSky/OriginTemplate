import React, {PropsWithChildren, useMemo} from 'react';
import {useColorScheme} from 'react-native';
import {TamaguiProvider} from 'tamagui';

import {AppTheme, ThemeMode, darkTheme, lightTheme} from '@/theme';
import {usePreferencesStore} from '@/stores/preferencesStore';
import tamaguiConfig from '../../tamagui.config';

interface ThemeContextValue {
  theme: AppTheme;
  mode: ThemeMode;
  isDark: boolean;
  setMode: (mode: ThemeMode) => void;
  toggleMode: () => void;
}

export const ThemeProvider = ({children}: PropsWithChildren) => {
  const {isDark} = useThemeState();

  return (
    <TamaguiProvider
      config={tamaguiConfig}
      defaultTheme={isDark ? 'dark' : 'light'}>
      {children}
    </TamaguiProvider>
  );
};

const useThemeState = () => {
  const systemScheme = useColorScheme();
  const mode = usePreferencesStore(state => state.themeMode);
  const setMode = usePreferencesStore(state => state.setThemeMode);
  const toggleMode = usePreferencesStore(state => state.toggleThemeMode);

  const isDark = mode === 'system' ? systemScheme === 'dark' : mode === 'dark';
  const theme = isDark ? darkTheme : lightTheme;

  return useMemo<ThemeContextValue>(
    () => ({
      theme,
      mode,
      isDark,
      setMode,
      toggleMode,
    }),
    [isDark, mode, setMode, theme, toggleMode],
  );
};

export const useAppTheme = useThemeState;
