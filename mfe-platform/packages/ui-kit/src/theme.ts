import { createTheme } from '@mui/material/styles';

export const appTheme = createTheme({
  spacing: 8,
  shape: {
    borderRadius: 10
  },
  palette: {
    mode: 'light',
    primary: {
      main: '#2f5d46',
      light: '#4f7a62',
      dark: '#214333',
      contrastText: '#f7f8f6'
    },
    secondary: {
      main: '#b45f3b',
      light: '#cf7d57',
      dark: '#8f4526',
      contrastText: '#ffffff'
    },
    background: {
      default: '#f2f0ea',
      paper: '#fcfbf8'
    },
    divider: '#d9d4c9',
    text: {
      primary: '#2f2b24',
      secondary: '#5f584c'
    },
    action: {
      hover: '#ebe7dd',
      selected: '#e3ddd0'
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
