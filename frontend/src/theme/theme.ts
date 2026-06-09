import { createTheme, alpha } from '@mui/material/styles';

// Trello-inspired modern palette
const BRAND = '#0c66e4'; // primary blue
const BRAND_DARK = '#0055cc';
const SURFACE = '#ffffff';
const CANVAS = '#f4f5f7'; // board canvas gray

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: BRAND,
      dark: BRAND_DARK,
      light: '#cce0ff',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#5e6c84',
    },
    success: { main: '#22a06b' },
    info: { main: '#0c66e4' },
    warning: { main: '#e2780f' },
    error: { main: '#c9372c' },
    background: {
      default: CANVAS,
      paper: SURFACE,
    },
    text: {
      primary: '#172b4d',
      secondary: '#5e6c84',
    },
    divider: '#dfe1e6',
  },
  shape: {
    borderRadius: 10,
  },
  typography: {
    fontFamily:
      '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif',
    h4: { fontWeight: 700, letterSpacing: '-0.02em' },
    h5: { fontWeight: 700, letterSpacing: '-0.01em' },
    h6: { fontWeight: 700 },
    subtitle1: { fontWeight: 600 },
    subtitle2: { fontWeight: 600 },
    button: { fontWeight: 600, textTransform: 'none' },
  },
  components: {
    MuiAppBar: {
      defaultProps: { elevation: 0 },
      styleOverrides: {
        root: {
          backgroundImage: 'none',
        },
      },
    },
    MuiPaper: {
      defaultProps: { elevation: 0 },
      styleOverrides: {
        root: {
          backgroundImage: 'none',
        },
        outlined: {
          borderColor: '#dfe1e6',
        },
      },
    },
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: {
          borderRadius: 8,
          paddingInline: 16,
        },
        containedPrimary: {
          boxShadow: `0 1px 2px ${alpha('#091e42', 0.2)}`,
          '&:hover': { backgroundColor: BRAND_DARK },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: { fontWeight: 600, borderRadius: 6 },
        sizeSmall: { height: 22 },
      },
    },
    MuiTextField: {
      defaultProps: { size: 'small' },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          backgroundColor: '#ffffff',
        },
      },
    },
    MuiPaginationItem: {
      styleOverrides: {
        root: { fontWeight: 600 },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        head: {
          fontWeight: 700,
          color: '#5e6c84',
          backgroundColor: '#f4f5f7',
          textTransform: 'uppercase',
          fontSize: 12,
          letterSpacing: '0.04em',
        },
      },
    },
  },
});

export default theme;
