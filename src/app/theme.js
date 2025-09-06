// src/app/theme.js
"use client";
import { createTheme } from "@mui/material/styles";

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#3b82f6',
      light: '#eff6ff', // A very light blue for backgrounds
    },
    secondary: {
      main: '#ec4899',
    },
    background: {
      default: '#f8fafc',
      paper: '#ffffff',
    },
    divider: '#e2e8f0', // A soft divider color
  },
  typography: {
    fontFamily: 'var(--font-geist-sans)',
    h4: {
      fontWeight: 700,
    },
    h6: {
      fontWeight: 600,
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 8,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
        },
      },
    },
    // Add new style override for Pagination
    MuiPaginationItem: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          border: '1px solid #e2e8f0',
          '&.Mui-selected': {
            backgroundColor: '#eff6ff',
            color: '#3b82f6',
            borderColor: '#3b82f6',
            fontWeight: 'bold',
            '&:hover': {
              backgroundColor: '#dbeafe',
            },
          },
        },
      },
    },
  },
});

export default theme;