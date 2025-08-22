import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { PaletteMode } from '@mui/material';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { createPromptPilotTheme, ThemeContextType } from './theme';

// Create theme context
const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// Theme storage key
const THEME_STORAGE_KEY = 'promptpilot-theme-mode';

interface PromptPilotThemeProviderProps {
  children: ReactNode;
}

export const PromptPilotThemeProvider: React.FC<PromptPilotThemeProviderProps> = ({ children }) => {
  // Initialize theme mode from localStorage or system preference
  const [mode, setMode] = useState<PaletteMode>(() => {
    // Check localStorage first
    const savedMode = localStorage.getItem(THEME_STORAGE_KEY) as PaletteMode;
    if (savedMode && (savedMode === 'light' || savedMode === 'dark')) {
      return savedMode;
    }

    // Fall back to system preference
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }

    return 'light';
  });

  // Toggle theme mode
  const toggleColorMode = () => {
    const newMode = mode === 'light' ? 'dark' : 'light';
    setMode(newMode);
    localStorage.setItem(THEME_STORAGE_KEY, newMode);
  };

  // Listen for system theme changes
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleChange = (e: MediaQueryListEvent) => {
      // Only update if no preference is stored
      if (!localStorage.getItem(THEME_STORAGE_KEY)) {
        setMode(e.matches ? 'dark' : 'light');
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // Create theme based on current mode
  const theme = createPromptPilotTheme(mode);

  // Context value
  const contextValue: ThemeContextType = {
    mode,
    toggleColorMode,
  };

  return (
    <ThemeContext.Provider value={contextValue}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </ThemeContext.Provider>
  );
};

// Hook to use theme context
export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a PromptPilotThemeProvider');
  }
  return context;
};

// Hook to get current theme mode
export const useThemeMode = (): PaletteMode => {
  const { mode } = useTheme();
  return mode;
};

// Hook to toggle theme
export const useToggleTheme = (): (() => void) => {
  const { toggleColorMode } = useTheme();
  return toggleColorMode;
};

export default PromptPilotThemeProvider;