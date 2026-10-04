import {defaultConfig} from '@tamagui/config/v5';
import {createTamagui} from 'tamagui';

import {darkTheme, lightTheme} from './src/theme';

const createAppTheme = (
  baseTheme: (typeof defaultConfig.themes)['light'],
  appTheme: typeof lightTheme,
) => ({
  ...baseTheme,
  background: appTheme.colors.background,
  surface: appTheme.colors.surface,
  surfaceMuted: appTheme.colors.surfaceMuted,
  color: appTheme.colors.text,
  colorMuted: appTheme.colors.textMuted,
  borderColor: appTheme.colors.border,
  primary: appTheme.colors.primary,
  primaryText: appTheme.colors.primaryText,
  success: appTheme.colors.success,
  warning: appTheme.colors.warning,
  danger: appTheme.colors.danger,
});

const tamaguiConfig = createTamagui({
  ...defaultConfig,
  settings: {
    ...defaultConfig.settings,
    onlyAllowShorthands: false,
  },
  themes: {
    ...defaultConfig.themes,
    light: createAppTheme(defaultConfig.themes.light, lightTheme),
    dark: createAppTheme(defaultConfig.themes.dark, darkTheme),
  },
});

export type AppTamaguiConfig = typeof tamaguiConfig;

declare module 'tamagui' {
  interface TamaguiCustomConfig extends AppTamaguiConfig {}
}

export default tamaguiConfig;
