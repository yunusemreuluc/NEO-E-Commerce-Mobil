// Merkezi tema konfigürasyonu
export const theme = {
  colors: {
    // Ana renkler
    primary: {
      50: '#fef2f2',
      100: '#fee2e2', 
      500: '#ef4444',
      600: '#dc2626',
      700: '#b91c1c',
      900: '#7f1d1d'
    },
    
    // Gri tonları (açık tema için)
    gray: {
      50: '#f9fafb',
      100: '#f3f4f6',
      200: '#e5e7eb',
      300: '#d1d5db',
      400: '#9ca3af',
      500: '#6b7280',
      600: '#4b5563',
      700: '#374151',
      800: '#1f2937',
      900: '#111827'
    },
    
    // Arka plan renkleri
    background: {
      primary: '#ffffff',
      secondary: '#f9fafb',
      tertiary: '#f3f4f6'
    },
    
    // Yazı renkleri
    text: {
      primary: '#111827',
      secondary: '#4b5563',
      muted: '#6b7280',
      inverse: '#ffffff'
    },
    
    // Kenarlık renkleri
    border: {
      light: '#e5e7eb',
      medium: '#d1d5db',
      dark: '#9ca3af'
    },
    
    // Durum renkleri
    status: {
      success: {
        bg: '#dcfce7',
        text: '#166534',
        border: '#bbf7d0'
      },
      warning: {
        bg: '#fef3c7',
        text: '#92400e',
        border: '#fde68a'
      },
      danger: {
        bg: '#fee2e2',
        text: '#991b1b',
        border: '#fecaca'
      },
      info: {
        bg: '#dbeafe',
        text: '#1e40af',
        border: '#bfdbfe'
      }
    }
  },
  
  // Tipografi
  typography: {
    fontFamily: {
      sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif']
    },
    fontSize: {
      xs: '0.75rem',
      sm: '0.875rem',
      base: '1rem',
      lg: '1.125rem',
      xl: '1.25rem',
      '2xl': '1.5rem',
      '3xl': '1.875rem'
    },
    fontWeight: {
      normal: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
      extrabold: '800'
    }
  },
  
  // Spacing
  spacing: {
    xs: '0.5rem',
    sm: '0.75rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem',
    '2xl': '3rem'
  },
  
  // Border radius
  borderRadius: {
    sm: '0.375rem',
    md: '0.5rem',
    lg: '0.75rem',
    xl: '1rem'
  },
  
  // Shadows
  shadows: {
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
    xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)'
  }
} as const;

// Tema utility fonksiyonları
export const getStatusColors = (status: 'success' | 'warning' | 'danger' | 'info') => {
  return theme.colors.status[status];
};

export const getButtonVariant = (variant: 'primary' | 'secondary' | 'danger' | 'outline') => {
  const variants = {
    primary: {
      bg: theme.colors.primary[500],
      hover: theme.colors.primary[600],
      text: theme.colors.text.inverse,
      border: theme.colors.primary[500]
    },
    secondary: {
      bg: theme.colors.gray[100],
      hover: theme.colors.gray[200],
      text: theme.colors.text.primary,
      border: theme.colors.border.light
    },
    danger: {
      bg: theme.colors.primary[500],
      hover: theme.colors.primary[600],
      text: theme.colors.text.inverse,
      border: theme.colors.primary[500]
    },
    outline: {
      bg: 'transparent',
      hover: theme.colors.gray[50],
      text: theme.colors.text.secondary,
      border: theme.colors.border.medium
    }
  };
  
  return variants[variant];
};