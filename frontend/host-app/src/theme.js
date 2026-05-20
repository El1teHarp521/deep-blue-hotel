import { createTheme } from '@mui/material/styles';

export const getCustomTheme = (mode) => createTheme({
  palette: {
    mode,
    ...(mode === 'light' 
      ? {
          primary: { main: '#002f6c' },
          secondary: { main: '#c1a37f' },
          background: { default: '#ffffff', paper: '#ffffff' },
          text: { primary: '#000000', secondary: '#4a4a4a' }
        } 
      : {
          primary: { main: '#ffffff' },
          secondary: { main: '#c1a37f' },
          background: { default: '#000814', paper: '#00122a' },
          text: { primary: '#ffffff', secondary: '#b3e5fc' }
        }),
  },
  typography: {
    fontFamily: '"Montserrat", "Inter", sans-serif',
    h1: { fontFamily: 'Playfair Display', fontWeight: 500, letterSpacing: '-0.02em' },
    h2: { fontFamily: 'Playfair Display', fontWeight: 500, letterSpacing: '0.02em' },
    h3: { fontFamily: 'Playfair Display', fontWeight: 500 },
    h4: { fontFamily: 'Playfair Display', letterSpacing: '0.1em' },
    h5: { fontFamily: 'Playfair Display', fontWeight: 600 },
    h6: { fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' },
    button: { fontWeight: 600, letterSpacing: '0.2em', fontSize: '0.75rem' }
  },
  components: {
    MuiContainer: {
      styleOverrides: {
        maxWidthXl: { maxWidth: '1440px !important' }
      }
    },
    MuiButton: {
      styleOverrides: {
        root: { borderRadius: 0, padding: '14px 32px' }
      }
    },
    MuiPaper: {
      styleOverrides: {
        root: { 
          borderRadius: 0,
          boxShadow: 'none',
          border: mode === 'light' ? '1px solid rgba(0, 47, 108, 0.15)' : '1px solid rgba(255, 255, 255, 0.08)'
        }
      }
    }
  }
});