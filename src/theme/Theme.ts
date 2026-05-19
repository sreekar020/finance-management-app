export interface ColorTheme {
  primary: string;
  secondary: string;
  gradientStart: string;
  gradientEnd: string;
  background: string;
  backgroundSecondary: string;
  card: string;
  text: string;
  textLight: string;
  danger: string;
  dangerLight: string;
  success: string;
  successLight: string;
  info: string;
  infoLight: string;
  white: string;
  border: string;
}

export interface SpaceTheme {
  xs: number;
  sm: number;
  md: number;
  lg: number;
  xl: number;
}

export interface RoundingTheme {
  sm: number;
  md: number;
  lg: number;
  xl: number;
  full: number;
}

export const COLORS: ColorTheme = {
  primary: '#3D8EE8', // Action button blue
  secondary: '#3B6DD9', // Secondary color for older linear gradients
  gradientStart: '#5B8DEE',
  gradientEnd: '#3B6DD9',
  background: '#F0F4FA', // Light blue-grey page background
  backgroundSecondary: '#E8F1FB', // Method toggle unselected/light blue accent
  card: '#ffffff',
  text: '#1F2937',
  textLight: '#6B7280',
  danger: '#EF4444',
  dangerLight: '#FEE2E2',
  success: '#10B981',
  successLight: '#D1FAE5',
  info: '#3D8EE8',
  infoLight: '#E8F1FB',
  white: '#ffffff',
  border: '#E5E7EB'
};

export const SPACE: SpaceTheme = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32
};

export const ROUNDING: RoundingTheme = {
  sm: 8,
  md: 10, // Form input & toggle radius
  lg: 14, // Main card border-radius
  xl: 18, // Extra rounded cards
  full: 9999
};

export const SHADOWS = {
  glass: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  }
};

import { Platform } from 'react-native';

export const TYPOGRAPHY = {
  fontFamily: Platform.select({
    ios: 'Avenir Next',
    android: 'sans-serif',
  }) || 'System',
  fontFamilyBold: Platform.select({
    ios: 'AvenirNext-Bold',
    android: 'sans-serif-medium',
  }) || 'System',
  fontFamilyMedium: Platform.select({
    ios: 'AvenirNext-Medium',
    android: 'sans-serif-medium',
  }) || 'System',
  monospace: Platform.select({
    ios: 'Courier New',
    android: 'monospace',
  }) || 'monospace'
};

