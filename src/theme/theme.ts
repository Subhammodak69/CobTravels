import React, { createContext, useContext, useEffect, useMemo } from 'react';
import { Appearance, ColorSchemeName, useColorScheme } from 'react-native';

export type AppColorScheme = 'light' | 'dark';

const LIGHT_COLORS = {
  primary: '#2F80ED', primaryDark: '#14213D', primaryLight: '#67A7FF', primarySubtle: '#EAF3FF',
  gold: '#F4B740', goldLight: '#FFF4D6', goldDark: '#B87900',
  whatsapp: '#25D366', whatsappDark: '#128C7E',
  bg: '#F7F8FA', card: '#FFFFFF', surface: '#F0F2F5',
  text: '#121417', textSecondary: '#667085', textMuted: '#98A2B3', textLight: '#FFFFFF',
  border: '#E4E7EC', borderDark: '#D0D5DD', domesticBg: '#EAF3FF', domesticText: '#1769D1', intlBg: '#F3E8FF', intlText: '#7E22CE',
  success: '#12B76A', successLight: '#D1FADF', danger: '#F04438', dangerLight: '#FEE4E2', warning: '#F79009',
} as const;

const DARK_COLORS = {
  primary: '#5CA7FF', primaryDark: '#07090D', primaryLight: '#8AC0FF', primarySubtle: '#12243A',
  gold: '#F5C451', goldLight: '#3A2D10', goldDark: '#F4C15D', whatsapp: '#25D366', whatsappDark: '#34D399',
  bg: '#07090D', card: '#111315', surface: '#191C21', text: '#F4F6F8', textSecondary: '#B5BBC5', textMuted: '#7E8794', textLight: '#FFFFFF',
  border: '#2A2F36', borderDark: '#3A424D', domesticBg: '#102D4C', domesticText: '#8AC0FF', intlBg: '#30164D', intlText: '#D8B4FE',
  success: '#5DD39E', successLight: '#123A2B', danger: '#FF7B72', dangerLight: '#4A1D1A', warning: '#F5C451',
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
