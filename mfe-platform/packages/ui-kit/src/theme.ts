import { createTheme } from '@mui/material/styles';

export const appTheme = createTheme({
  spacing: 8,
  shape: {
    borderRadius: 10
  },
  palette: {
    mode: 'light',
    primary: {
      main: '#0f62fe'
    },
    secondary: {
      main: '#6f2dbd'
    },
    background: {
      default: '#f6f8fb',
      paper: '#ffffff'
    },
    text: {
      primary: '#0f172a',
      secondary: '#475569'
    }
  },
  typography: {
    fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
    h4: {
      fontWeight: 700,
      letterSpacing: -0.2
    },
    h5: {
      fontWeight: 700
    },
    h6: {
      fontWeight: 600
    },
    body1: {
      lineHeight: 1.5
    },
    body2: {
      lineHeight: 1.45
    }
  }
});
