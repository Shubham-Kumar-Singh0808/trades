import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#3a8a3a',
      light: '#5ba55b',
      dark: '#2d6b2d',
    },
    secondary: {
      main: '#f59e0b',
    },
    background: {
      default: '#f4f7f9',
      paper: '#ffffff',
    },
  },
  typography: {
    fontFamily: '"Plus Jakarta Sans", "Poppins", sans-serif',
    h4: {
      fontFamily: '"Poppins", sans-serif',
      fontWeight: 700,
      letterSpacing: 0.4,
    },
    h5: {
      fontFamily: '"Poppins", sans-serif',
      fontWeight: 700,
    },
    button: {
      textTransform: 'none',
      fontWeight: 600,
      letterSpacing: '0.5px',
    },
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        contained: {
          boxShadow: '0 2px 8px rgba(58, 138, 58, 0.25)',
          transition: 'all 0.3s ease',
          '&:hover': {
            boxShadow: '0 4px 16px rgba(58, 138, 58, 0.35)',
            transform: 'translateY(-2px)',
          },
          '&:active': {
            transform: 'translateY(0px)',
          },
        },
        outlined: {
          borderWidth: '2px',
          '&:hover': {
            borderWidth: '2px',
            backgroundColor: 'rgba(58, 138, 58, 0.04)',
          },
        },
      },
      defaultProps: {
        disableElevation: false,
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          transition: 'all 0.3s ease',
          '&:hover': {
            backgroundColor: 'rgba(58, 138, 58, 0.08)',
          },
        },
      },
    },
  },
});

export default theme;
