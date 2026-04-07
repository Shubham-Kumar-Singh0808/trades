import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#0f766e',
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
    },
  },
  shape: {
    borderRadius: 12,
  },
});

export default theme;
