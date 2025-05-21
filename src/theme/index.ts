// Theme colors
export const colors = {
  primary: '#4A7AFF',
  primaryDark: '#3A62CC',
  primaryLight: '#D9E3FF',
  secondary: '#FF7A4A',
  secondaryDark: '#CC6237',
  secondaryLight: '#FFE1D9',
  success: '#4CAF50',
  warning: '#FFC107',
  error: '#F44336',
  text: {
    primary: '#333333',
    secondary: '#717171',
    disabled: '#9E9E9E',
    inverse: '#FFFFFF',
  },
  background: {
    primary: '#FFFFFF',
    secondary: '#F5F7FA',
    tertiary: '#E5E9F0',
  },
  border: '#E0E0E0',
};

// Spacing
export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

// Typography
export const typography = {
  fontFamily: {
    regular: 'System',
    medium: 'System',
    bold: 'System',
  },
  fontSize: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 20,
    xxl: 24,
    xxxl: 32,
  },
  lineHeight: {
    xs: 16,
    sm: 20,
    md: 24,
    lg: 28,
    xl: 32,
    xxl: 36,
    xxxl: 42,
  },
};

// Border radius
export const borderRadius = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  round: 9999,
};

// Shadows
export const shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.18,
    shadowRadius: 1.0,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.23,
    shadowRadius: 2.62,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
};

// Screen dimensions
export const dimensions = {
  fullWidth: '100%',
  fullHeight: '100%',
};

// Common styles
export const commonStyles = {
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  row: {
    flexDirection: 'row',
  },
  column: {
    flexDirection: 'column',
  },
};

// Export as a complete theme
export default {
  colors,
  spacing,
  typography,
  borderRadius,
  shadows,
  dimensions,
  commonStyles,
}; 