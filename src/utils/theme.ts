import { MD3DarkTheme, MD3LightTheme, MD3Theme } from 'react-native-paper';

export const darkColors = {
  background: '#0B0C0E',
  card: '#14161A',
  surface: '#1C1E23',
  textPrimary: '#EDEFF2',
  textMuted: '#9AA3AF',
  textDisabled: '#6B7280',
  accent: '#7C5CFF',
  accentLight: '#9B7FFF',
  positive: '#22C55E',
  negative: '#EF4444',
  warning: '#F59E0B',
  border: '#2A2D35',
  divider: '#1F2128',
};

export const lightColors = {
  background: '#FFFFFF',
  card: '#F9FAFB',
  surface: '#F3F4F6',
  textPrimary: '#111827',
  textMuted: '#6B7280',
  textDisabled: '#9CA3AF',
  accent: '#7C5CFF',
  accentLight: '#9B7FFF',
  positive: '#16A34A',
  negative: '#DC2626',
  warning: '#D97706',
  border: '#E5E7EB',
  divider: '#F3F4F6',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
};

export const typography = {
  fontFamily: 'Inter_400Regular',
  fontFamilyMedium: 'Inter_500Medium',
  fontFamilySemiBold: 'Inter_600SemiBold',
  fontFamilyBold: 'Inter_700Bold',
  h1: {
    fontSize: 32,
    lineHeight: 40,
    fontWeight: '700' as const,
  },
  h2: {
    fontSize: 24,
    lineHeight: 32,
    fontWeight: '700' as const,
  },
  h3: {
    fontSize: 20,
    lineHeight: 28,
    fontWeight: '600' as const,
  },
  h4: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '600' as const,
  },
  body: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '400' as const,
  },
  bodyMedium: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '500' as const,
  },
  caption: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '400' as const,
  },
  small: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '400' as const,
  },
};

export const borderRadius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  full: 9999,
};

export const shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
};

export const darkTheme: MD3Theme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: darkColors.accent,
    background: darkColors.background,
    surface: darkColors.card,
    surfaceVariant: darkColors.surface,
    onBackground: darkColors.textPrimary,
    onSurface: darkColors.textPrimary,
    onSurfaceVariant: darkColors.textMuted,
    error: darkColors.negative,
    outline: darkColors.border,
  },
  fonts: {
    ...MD3DarkTheme.fonts,
    default: {
      fontFamily: typography.fontFamily,
      fontWeight: '400',
      letterSpacing: 0,
    },
  },
};

export const lightTheme: MD3Theme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: lightColors.accent,
    background: lightColors.background,
    surface: lightColors.card,
    surfaceVariant: lightColors.surface,
    onBackground: lightColors.textPrimary,
    onSurface: lightColors.textPrimary,
    onSurfaceVariant: lightColors.textMuted,
    error: lightColors.negative,
    outline: lightColors.border,
  },
  fonts: {
    ...MD3LightTheme.fonts,
    default: {
      fontFamily: typography.fontFamily,
      fontWeight: '400',
      letterSpacing: 0,
    },
  },
};
