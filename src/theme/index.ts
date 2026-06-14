export type ThemeMode = 'system' | 'light' | 'dark';

const palette = {
  blue: '#2563EB',
  blueDark: '#60A5FA',
  emerald: '#059669',
  emeraldDark: '#34D399',
  amber: '#D97706',
  amberDark: '#FBBF24',
  red: '#DC2626',
  redDark: '#F87171',
  white: '#FFFFFF',
  black: '#111827',
  slate50: '#F8FAFC',
  slate100: '#F1F5F9',
  slate200: '#E2E8F0',
  slate400: '#94A3B8',
  slate500: '#64748B',
  slate700: '#334155',
  slate800: '#1E293B',
  slate900: '#0F172A',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
};

export const radius = {
  sm: 6,
  md: 8,
  lg: 12,
};

export const typography = {
  title: {
    fontSize: 24,
    lineHeight: 32,
    fontWeight: '700' as const,
  },
  subtitle: {
    fontSize: 18,
    lineHeight: 26,
    fontWeight: '700' as const,
  },
  body: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '400' as const,
  },
  caption: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '400' as const,
  },
};

export const lightTheme = {
  isDark: false,
  colors: {
    background: palette.slate50,
    surface: palette.white,
    surfaceMuted: palette.slate100,
    text: palette.black,
    textMuted: palette.slate500,
    border: palette.slate200,
    primary: palette.blue,
    primaryText: palette.white,
    success: palette.emerald,
    warning: palette.amber,
    danger: palette.red,
  },
  spacing,
  radius,
  typography,
};

export const darkTheme = {
  isDark: true,
  colors: {
    background: palette.slate900,
    surface: palette.slate800,
    surfaceMuted: palette.slate700,
    text: palette.slate50,
    textMuted: palette.slate400,
    border: palette.slate700,
    primary: palette.blueDark,
    primaryText: palette.slate900,
    success: palette.emeraldDark,
    warning: palette.amberDark,
    danger: palette.redDark,
  },
  spacing,
  radius,
  typography,
};

export type AppTheme = typeof lightTheme;
