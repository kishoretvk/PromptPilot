import { createTheme, ThemeOptions } from '@mui/material/styles';
import { PaletteMode } from '@mui/material';

// PromptPilot color palette
const promptPilotColors = {
  primary: {
    50: '#e3f2fd',
    100: '#bbdefb',
    200: '#90caf9',
    300: '#64b5f6',
    400: '#42a5f5',
    500: '#2196f3',  // Main primary
    600: '#1e88e5',
    700: '#1976d2',
    800: '#1565c0',
    900: '#0d47a1',
  },
  secondary: {
    50: '#f3e5f5',
    100: '#e1bee7',
    200: '#ce93d8',
    300: '#ba68c8',
    400: '#ab47bc',
    500: '#9c27b0',  // Main secondary
    600: '#8e24aa',
    700: '#7b1fa2',
    800: '#6a1b9a',
    900: '#4a148c',
  },
  accent: {
    50: '#fff3e0',
    100: '#ffe0b2',
    200: '#ffcc80',
    300: '#ffb74d',
    400: '#ffa726',
    500: '#ff9800',  // Main accent
    600: '#fb8c00',
    700: '#f57c00',
    800: '#ef6c00',
    900: '#e65100',
  },
  success: {
    50: '#e8f5e8',
    100: '#c8e6c9',
    200: '#a5d6a7',
    300: '#81c784',
    400: '#66bb6a',
    500: '#4caf50',  // Main success
    600: '#43a047',
    700: '#388e3c',
    800: '#2e7d32',
    900: '#1b5e20',
  },
  warning: {
    50: '#fff8e1',
    100: '#ffecb3',
    200: '#ffe082',
    300: '#ffd54f',
    400: '#ffca28',
    500: '#ffc107',  // Main warning
    600: '#ffb300',
    700: '#ffa000',
    800: '#ff8f00',
    900: '#ff6f00',
  },
  error: {
    50: '#ffebee',
    100: '#ffcdd2',
    200: '#ef9a9a',
    300: '#e57373',
    400: '#ef5350',
    500: '#f44336',  // Main error
    600: '#e53935',
    700: '#d32f2f',
    800: '#c62828',
    900: '#b71c1c',
  },
};

// Typography configuration
const typography = {
  fontFamily: '\"Inter\", \"Roboto\", \"Helvetica\", \"Arial\", sans-serif',
  h1: {
    fontSize: '2.5rem',
    fontWeight: 700,
    lineHeight: 1.2,
  },
  h2: {
    fontSize: '2rem',
    fontWeight: 600,
    lineHeight: 1.3,
  },
  h3: {
    fontSize: '1.75rem',
    fontWeight: 600,
    lineHeight: 1.4,
  },
  h4: {
    fontSize: '1.5rem',
    fontWeight: 500,
    lineHeight: 1.4,
  },
  h5: {
    fontSize: '1.25rem',
    fontWeight: 500,
    lineHeight: 1.5,
  },
  h6: {
    fontSize: '1.1rem',
    fontWeight: 500,
    lineHeight: 1.5,
  },
  subtitle1: {
    fontSize: '1rem',
    fontWeight: 400,
    lineHeight: 1.5,
  },
  subtitle2: {
    fontSize: '0.875rem',
    fontWeight: 500,
    lineHeight: 1.5,
  },
  body1: {
    fontSize: '1rem',
    fontWeight: 400,
    lineHeight: 1.6,
  },
  body2: {
    fontSize: '0.875rem',
    fontWeight: 400,
    lineHeight: 1.6,
  },
  button: {
    fontSize: '0.875rem',
    fontWeight: 500,
    lineHeight: 1.4,
    textTransform: 'none' as const,
  },
  caption: {
    fontSize: '0.75rem',
    fontWeight: 400,
    lineHeight: 1.4,
  },
  overline: {
    fontSize: '0.75rem',
    fontWeight: 400,
    lineHeight: 2.5,
    textTransform: 'uppercase' as const,
  },
};

// Component overrides
const getComponentOverrides = (mode: PaletteMode) => ({
  MuiCssBaseline: {
    styleOverrides: {
      body: {
        scrollbarColor: mode === 'dark' ? '#6b6b6b #2b2b2b' : '#959595 #f0f0f0',
        '&::-webkit-scrollbar, & *::-webkit-scrollbar': {
          backgroundColor: mode === 'dark' ? '#2b2b2b' : '#f0f0f0',
          width: 8,
        },
        '&::-webkit-scrollbar-thumb, & *::-webkit-scrollbar-thumb': {
          borderRadius: 8,
          backgroundColor: mode === 'dark' ? '#6b6b6b' : '#959595',
          minHeight: 24,
        },
        '&::-webkit-scrollbar-thumb:focus, & *::-webkit-scrollbar-thumb:focus': {
          backgroundColor: mode === 'dark' ? '#959595' : '#6b6b6b',
        },
        '&::-webkit-scrollbar-thumb:active, & *::-webkit-scrollbar-thumb:active': {
          backgroundColor: mode === 'dark' ? '#959595' : '#6b6b6b',
        },
        '&::-webkit-scrollbar-thumb:hover, & *::-webkit-scrollbar-thumb:hover': {
          backgroundColor: mode === 'dark' ? '#959595' : '#6b6b6b',
        },
        '&::-webkit-scrollbar-corner, & *::-webkit-scrollbar-corner': {
          backgroundColor: mode === 'dark' ? '#2b2b2b' : '#f0f0f0',
        },
      },
    },
  },
  MuiButton: {
    styleOverrides: {
      root: {
        borderRadius: 8,
        textTransform: 'none',
        fontWeight: 500,
        padding: '8px 16px',
      },
      contained: {
        boxShadow: 'none',
        '&:hover': {
          boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
        },
      },
    },
  },
  MuiCard: {
    styleOverrides: {
      root: {
        borderRadius: 12,
        boxShadow: mode === 'dark' 
          ? '0px 2px 8px rgba(0, 0, 0, 0.3)'
          : '0px 2px 8px rgba(0, 0, 0, 0.1)',
      },
    },
  },
  MuiPaper: {
    styleOverrides: {
      root: {
        borderRadius: 8,
      },
    },
  },
  MuiTextField: {
    styleOverrides: {
      root: {
        '& .MuiOutlinedInput-root': {
          borderRadius: 8,
        },
      },
    },
  },
  MuiChip: {
    styleOverrides: {
      root: {
        borderRadius: 16,
      },
    },
  },
  MuiAlert: {
    styleOverrides: {
      root: {
        borderRadius: 8,
      },
    },
  },
  MuiDialog: {
    styleOverrides: {
      paper: {
        borderRadius: 12,
      },
    },
  },
  MuiDrawer: {
    styleOverrides: {
      paper: {
        borderRadius: 0,
      },
    },
  },
});

// Light theme configuration
const lightTheme: ThemeOptions = {
  palette: {
    mode: 'light',
    primary: {
      main: promptPilotColors.primary[500],
      light: promptPilotColors.primary[300],
      dark: promptPilotColors.primary[700],
      contrastText: '#ffffff',
    },
    secondary: {
      main: promptPilotColors.secondary[500],
      light: promptPilotColors.secondary[300],
      dark: promptPilotColors.secondary[700],
      contrastText: '#ffffff',
    },
    error: {
      main: promptPilotColors.error[500],
      light: promptPilotColors.error[300],
      dark: promptPilotColors.error[700],
    },
    warning: {
      main: promptPilotColors.warning[500],
      light: promptPilotColors.warning[300],
      dark: promptPilotColors.warning[700],
    },
    success: {
      main: promptPilotColors.success[500],
      light: promptPilotColors.success[300],
      dark: promptPilotColors.success[700],
    },
    background: {
      default: '#fafafa',
      paper: '#ffffff',
    },
    text: {
      primary: 'rgba(0, 0, 0, 0.87)',
      secondary: 'rgba(0, 0, 0, 0.6)',
      disabled: 'rgba(0, 0, 0, 0.38)',
    },
    divider: 'rgba(0, 0, 0, 0.12)',
  },
  typography,
  components: getComponentOverrides('light'),
  spacing: 8,
  shape: {
    borderRadius: 8,
  },
};

// Dark theme configuration
const darkTheme: ThemeOptions = {
  palette: {
    mode: 'dark',
    primary: {
      main: promptPilotColors.primary[400],
      light: promptPilotColors.primary[200],
      dark: promptPilotColors.primary[600],
      contrastText: '#ffffff',
    },
    secondary: {
      main: promptPilotColors.secondary[400],
      light: promptPilotColors.secondary[200],
      dark: promptPilotColors.secondary[600],
      contrastText: '#ffffff',
    },
    error: {
      main: promptPilotColors.error[400],
      light: promptPilotColors.error[200],
      dark: promptPilotColors.error[600],
    },
    warning: {
      main: promptPilotColors.warning[400],
      light: promptPilotColors.warning[200],
      dark: promptPilotColors.warning[600],
    },
    success: {
      main: promptPilotColors.success[400],
      light: promptPilotColors.success[200],
      dark: promptPilotColors.success[600],
    },
    background: {
      default: '#121212',
      paper: '#1e1e1e',
    },
    text: {
      primary: '#ffffff',
      secondary: 'rgba(255, 255, 255, 0.7)',
      disabled: 'rgba(255, 255, 255, 0.5)',
    },
    divider: 'rgba(255, 255, 255, 0.12)',
  },
  typography,
  components: getComponentOverrides('dark'),
  spacing: 8,
  shape: {
    borderRadius: 8,
  },
};

// Create themes
export const createPromptPilotTheme = (mode: PaletteMode) => {
  return createTheme(mode === 'dark' ? darkTheme : lightTheme);
};

// Default themes
export const lightPromptPilotTheme = createTheme(lightTheme);
export const darkPromptPilotTheme = createTheme(darkTheme);

// Theme context types
export interface ThemeContextType {
  mode: PaletteMode;
  toggleColorMode: () => void;
}

// Breakpoints for responsive design
export const breakpoints = {
  xs: 0,
  sm: 600,
  md: 900,
  lg: 1200,
  xl: 1536,
};

// Custom spacing values
export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

// Z-index values
export const zIndex = {
  drawer: 1200,
  modal: 1300,
  snackbar: 1400,
  tooltip: 1500,
};

export default createPromptPilotTheme;