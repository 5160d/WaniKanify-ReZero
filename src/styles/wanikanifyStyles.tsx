import { createTheme } from '@mui/material/styles';

declare module '@mui/material/styles' {
  interface Palette {
    tooltipBackground: string;
  }
  interface PaletteOptions {
    tooltipBackground?: string;
  }
}

export const waniStyle = (mode: 'light' | 'dark') => createTheme({
  palette: {
    mode,
    primary: {
      main: '#6D28D9',
      light: '#7C3AED',
      dark: '#5B21B6',
    },
    secondary: {
      main: '#059669',
      light: '#10B981',
      dark: '#047857',
    },
    background: {
      default: mode === 'light' ? '#F9FAFB' : '#111827',
      paper: mode === 'light' ? '#FFFFFF' : '#1F2937',
    },
    tooltipBackground: mode === 'light' ? 'rgba(221, 221, 221, 0.95)' : 'rgba(0, 0, 0, 0.95)',
    divider: mode === 'light' ? 'rgba(0, 0, 0, 0.12)' : 'rgba(255, 255, 255, 0.12)',
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          transition: 'all 0.2s ease-in-out',
          '&:hover': {
            boxShadow: mode === 'light' 
              ? '0 4px 20px rgba(0,0,0,0.1)'
              : '0 4px 20px rgba(0,0,0,0.5)',
          },
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          textTransform: 'none',
          fontWeight: 600,
        },
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          backgroundColor: mode === 'light' ? 'rgba(255, 255, 255, 0.95)' : 'rgba(0, 0, 0, 0.70)',
          padding: 0,
        },
        arrow: {
          color: mode === 'light' ? 'rgba(255, 255, 255, 0.95)' : 'rgba(0, 0, 0, 0.95)',
        },
      },
    },
  },
});