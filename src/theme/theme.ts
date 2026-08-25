import React, { createContext, useContext, useEffect, useMemo } from 'react';
import { Appearance, ColorSchemeName, useColorScheme } from 'react-native';

export type AppColorScheme = 'light' | 'dark';

const LIGHT_COLORS = {
  primary: '#0D3B36', primaryDark: '#072421', primaryLight: '#185B54', primarySubtle: '#E6F4F1',
  gold: '#D97706', goldLight: '#FEF3C7', goldDark: '#B45309',
  whatsapp: '#25D366', whatsappDark: '#128C7E',
  bg: '#FFFFFF', card: '#FFFFFF', surface: '#F8FAFC',
  text: '#0F172A', textSecondary: '#475569', textMuted: '#94A3B8', textLight: '#F8FAFC',
  border: '#E2E8F0', borderDark: '#CBD5E1', domesticBg: '#E0F2FE', domesticText: '#0284C7', intlBg: '#F3E8FF', intlText: '#7E22CE',
  success: '#10B981', successLight: '#D1FAE5', danger: '#EF4444', dangerLight: '#FEE2E2', warning: '#F59E0B',
} as const;

const DARK_COLORS = {
  primary: '#14B8A6', primaryDark: '#041312', primaryLight: '#2DD4BF', primarySubtle: '#0F2D29',
  gold: '#FBBF24', goldLight: '#4A3510', goldDark: '#F59E0B', whatsapp: '#25D366', whatsappDark: '#34D399',
  bg: '#041312', card: '#0A221F', surface: '#123B36', text: '#F8FAFC', textSecondary: '#94A3B8', textMuted: '#64748B', textLight: '#FFFFFF',
  border: '#16433E', borderDark: '#205650', domesticBg: '#0C4A6E', domesticText: '#7DD3FC', intlBg: '#3B0764', intlText: '#D8B4FE',
  success: '#34D399', successLight: '#064E3B', danger: '#F87171', dangerLight: '#7F1D1D', warning: '#FBBF24',
} as const;

export type AppColors = { [key in keyof typeof LIGHT_COLORS]: string };

export const getColors = (scheme: ColorSchemeName | null): AppColors => {
  return scheme === 'dark' ? { ...DARK_COLORS } : { ...LIGHT_COLORS };
};

/**
 * COLORS is a mutable singleton kept in sync by ThemeProvider.
 * It is used by StyleSheet.create() calls — those are static and won't re-render,
 * but useColors() returns a reactive copy that triggers re-renders.
 */
export const COLORS: AppColors = { ...getColors(Appearance.getColorScheme()) };

// ─── React Context ─────────────────────────────────────────────────────────────

interface ThemeContextValue {
  colors: AppColors;
  scheme: AppColorScheme;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextValue>({
  colors: { ...LIGHT_COLORS },
  scheme: 'light',
  isDark: false,
});

/**
 * Wrap your root component with this provider.
 * It syncs COLORS singleton AND provides reactive context.
 */
export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const raw = useColorScheme();
  const scheme: AppColorScheme = raw === 'dark' ? 'dark' : 'light';
  const colors = useMemo(() => getColors(scheme), [scheme]);

  // Keep the COLORS singleton in sync so StyleSheet.create()-based components
  // at least pick up new values on next mount / re-render cycle.
  useEffect(() => {
    Object.assign(COLORS, colors);
  }, [colors]);

  const value = useMemo<ThemeContextValue>(
    () => ({ colors, scheme, isDark: scheme === 'dark' }),
    [colors, scheme],
  );

  return React.createElement(ThemeContext.Provider, { value }, children);
};

/** Reactive hook — call this inside function components to get theme-aware colors. */
export function useColors(): AppColors {
  return useContext(ThemeContext).colors;
}

/** Returns the full theme context (colors + scheme + isDark). */
export function useTheme(): ThemeContextValue {
  return useContext(ThemeContext);
}

export function useAppColorScheme(): AppColorScheme {
  const scheme = useColorScheme();
  return scheme === 'dark' ? 'dark' : 'light';
}

export const FONTS = { regular: 'System', medium: 'System', bold: 'System' };
