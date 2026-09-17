import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

export type DashboardTheme = 'light' | 'dark';

const STORAGE_KEY = 'singa-dashboard-theme';

interface ThemeContextValue {
  theme: DashboardTheme;
  setTheme: (theme: DashboardTheme) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

function readStoredTheme(): DashboardTheme {
  if (typeof window === 'undefined') return 'light';
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === 'dark' || stored === 'light') return stored;
  } catch {
    // ignore unreadable storage
  }
  return 'light';
}

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<DashboardTheme>(readStoredTheme);

  const applyTheme = (nextTheme: DashboardTheme) => {
    if (typeof document !== 'undefined') {
      document.documentElement.dataset.dashboardTheme = nextTheme;
    }
  };

  const setTheme = (nextTheme: DashboardTheme) => {
    setThemeState(nextTheme);
  };

  useEffect(() => {
    applyTheme(theme);
    try {
      window.localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      // ignore storage failures
    }
  }, [theme]);

  // Apply the theme before first paint to avoid flash of incorrect theme.
  const value = useMemo<ThemeContextValue>(() => ({
    theme,
    setTheme,
    toggleTheme: () => setTheme(theme === 'dark' ? 'light' : 'dark'),
  }), [theme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within ThemeProvider');
  return context;
};

// Applies the persisted theme immediately (before React renders child commits)
// by running in the same module scope when first imported.
if (typeof window !== 'undefined') {
  const stored = readStoredTheme();
  document.documentElement.dataset.dashboardTheme = stored;
}