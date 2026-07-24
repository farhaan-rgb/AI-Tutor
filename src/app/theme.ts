import { createTheme } from '@mui/material/styles';

/**
 * Material UI Theme that maps to CSS variables from /src/styles/theme.css
 * This ensures all MUI components use our custom design system
 */
const theme = createTheme({
  palette: {
    mode: 'dark', // Default to dark mode
    primary: {
      main: '#7F56D9', // var(--primary-600)
      light: '#9E77ED', // var(--primary-500)
      dark: '#6941C6', // var(--primary-700)
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: '#1D2939', // var(--secondary)
      light: '#344054', // var(--gray-700)
      dark: '#101828', // var(--gray-900)
      contrastText: '#D0D5DD',
    },
    error: {
      main: '#F04438', // var(--error-500)
      light: '#FEE4E2', // var(--error-100)
      dark: '#B42318', // var(--error-700)
      contrastText: '#FFFFFF',
    },
    warning: {
      main: '#F79009', // var(--warning-500)
      light: '#FEF0C7', // var(--warning-100)
      dark: '#B54708', // var(--warning-700)
      contrastText: '#FFFFFF',
    },
    success: {
      main: '#17B26A', // var(--success-500)
      light: '#D1FADF', // var(--success-100)
      dark: '#067647', // var(--success-700)
      contrastText: '#FFFFFF',
    },
    background: {
      default: '#0C111D', // var(--background)
      paper: '#101828', // var(--card)
    },
    text: {
      primary: '#F9FAFB', // var(--foreground)
      secondary: '#98A2B3', // var(--muted-foreground)
      disabled: '#667085', // var(--gray-500)
    },
    divider: '#344054', // var(--border)
  },
  
  typography: {
    fontFamily: 'var(--font-family-inter)',
    fontSize: 16,
    
    h1: {
      fontFamily: 'var(--font-family-inter)',
      fontSize: '48px', // var(--text-3xl)
      fontWeight: 700, // var(--font-weight-bold)
      lineHeight: 1.2,
    },
    h2: {
      fontFamily: 'var(--font-family-inter)',
      fontSize: '30px', // var(--text-2xl)
      fontWeight: 600, // var(--font-weight-semibold)
      lineHeight: 1.2,
    },
    h3: {
      fontFamily: 'var(--font-family-inter)',
      fontSize: '20px', // var(--text-xl)
      fontWeight: 600,
      lineHeight: 1.3,
    },
    h4: {
      fontFamily: 'var(--font-family-inter)',
      fontSize: '18px', // var(--text-lg)
      fontWeight: 600,
      lineHeight: 1.4,
    },
    h5: {
      fontFamily: 'var(--font-family-inter)',
      fontSize: '16px', // var(--text-base)
      fontWeight: 600,
      lineHeight: 1.4,
    },
    h6: {
      fontFamily: 'var(--font-family-inter)',
      fontSize: '14px', // var(--text-sm)
      fontWeight: 600,
      lineHeight: 1.4,
    },
    body1: {
      fontFamily: 'var(--font-family-inter)',
      fontSize: '16px', // var(--text-base)
      fontWeight: 400, // var(--font-weight-normal)
      lineHeight: 1.5,
    },
    body2: {
      fontFamily: 'var(--font-family-inter)',
      fontSize: '14px', // var(--text-sm)
      fontWeight: 400,
      lineHeight: 1.5,
    },
    button: {
      fontFamily: 'var(--font-family-inter)',
      fontSize: '14px', // var(--text-sm)
      fontWeight: 600, // var(--font-weight-semibold)
      lineHeight: 1.5,
      textTransform: 'none', // Disable uppercase transformation
    },
    caption: {
      fontFamily: 'var(--font-family-inter)',
      fontSize: '12px', // var(--text-xs)
      fontWeight: 500, // var(--font-weight-medium)
      lineHeight: 1.5,
    },
    overline: {
      fontFamily: 'var(--font-family-inter)',
      fontSize: '12px', // var(--text-xs)
      fontWeight: 600,
      lineHeight: 1.5,
      textTransform: 'uppercase',
      letterSpacing: '0.5px',
    },
  },
  
  shape: {
    borderRadius: 8, // var(--radius)
  },
  
  spacing: 4, // Base unit (8px grid system = 4 * 2)
  
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: '8px', // var(--radius-button)
          boxShadow: 'none',
          fontWeight: 600,
          padding: '8px 16px',
          '&:hover': {
            boxShadow: 'none',
          },
        },
        sizeLarge: {
          padding: '12px 24px',
          fontSize: '16px', // var(--text-base)
        },
        sizeMedium: {
          padding: '8px 16px',
          fontSize: '14px', // var(--text-sm)
        },
        sizeSmall: {
          padding: '6px 12px',
          fontSize: '14px',
        },
        contained: {
          boxShadow: 'none',
          '&:hover': {
            boxShadow: 'none',
          },
        },
      },
    },
    
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: '12px', // var(--radius-card)
          backgroundColor: '#101828', // var(--card)
          color: '#D0D5DD', // var(--card-foreground)
          boxShadow: '0px 2px 4px -2px rgba(12, 17, 29, 0.06), 0px 4px 8px -2px rgba(12, 17, 29, 0.10)', // var(--elevation-md)
        },
      },
    },
    
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: '8px', // var(--radius)
            backgroundColor: '#101828', // var(--input-background)
            fontFamily: 'var(--font-family-inter)',
            fontSize: '16px',
            '& fieldset': {
              borderColor: '#344054', // var(--border)
            },
            '&:hover fieldset': {
              borderColor: '#475467', // var(--gray-600)
            },
            '&.Mui-focused fieldset': {
              borderColor: '#7F56D9', // var(--primary)
            },
          },
        },
      },
    },
    
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: '999px', // var(--radius-full)
          fontFamily: 'var(--font-family-inter)',
          fontSize: '12px',
          fontWeight: 500,
        },
      },
    },
    
    MuiLinearProgress: {
      styleOverrides: {
        root: {
          borderRadius: '999px', // var(--radius-full)
          height: '8px',
          backgroundColor: '#1D2939', // var(--secondary)
        },
        bar: {
          borderRadius: '999px',
        },
      },
    },
    
    MuiBottomNavigation: {
      styleOverrides: {
        root: {
          backgroundColor: '#101828', // var(--card)
          borderTop: '1px solid #344054', // var(--border)
          height: '64px',
        },
      },
    },
    
    MuiBottomNavigationAction: {
      styleOverrides: {
        root: {
          color: '#98A2B3', // var(--muted-foreground)
          '&.Mui-selected': {
            color: '#7F56D9', // var(--primary)
          },
          '& .MuiSvgIcon-root': {
            fontSize: '24px',
          },
        },
        label: {
          fontFamily: 'var(--font-family-inter)',
          fontSize: '12px',
          fontWeight: 500,
          '&.Mui-selected': {
            fontSize: '12px',
            fontWeight: 600,
          },
        },
      },
    },
    
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: '12px', // var(--radius-card)
          backgroundColor: '#101828', // var(--card)
          backgroundImage: 'none',
        },
      },
    },
    
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundColor: '#0C111D', // var(--background)
          borderColor: '#344054', // var(--border)
        },
      },
    },
    
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: '#0C111D', // var(--background)
          backgroundImage: 'none',
          boxShadow: 'none',
          borderBottom: '1px solid #344054', // var(--border)
        },
      },
    },
    
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: '8px',
          '&.Mui-selected': {
            backgroundColor: 'rgba(127, 86, 217, 0.12)', // var(--primary-alpha-12)
            color: '#7F56D9', // var(--primary)
            '&:hover': {
              backgroundColor: 'rgba(127, 86, 217, 0.20)', // var(--primary-alpha-20)
            },
          },
          '&:hover': {
            backgroundColor: 'rgba(255, 255, 255, 0.04)', // var(--white-alpha-4)
          },
        },
      },
    },
    
    MuiAvatar: {
      styleOverrides: {
        root: {
          fontFamily: 'var(--font-family-inter)',
          fontWeight: 600,
        },
      },
    },
    
    MuiBadge: {
      styleOverrides: {
        badge: {
          fontFamily: 'var(--font-family-inter)',
          fontWeight: 600,
          fontSize: '11px',
        },
      },
    },
  },
});

export default theme;
