// Main Color Palette
export const colorPalette = {
  red: '#d13728',      // (209,55,40) - Primary/Accent
  orange: '#ee923c',   // (238,146,60) - Secondary/Warning
  cream: '#e6cc84',    // (230,204,132) - Background/Neutral
  mint: '#b0dac2',     // (176,218,194) - Success/Positive
  blue: '#436b88',     // (67,107,136) - Info/Navigation
};

// Extended color variations
export const colors = {
  ...colorPalette,

  // Red variations
  redLight: '#e85a4a',
  redDark: '#a12a1f',

  // Orange variations
  orangeLight: '#f1a65c',
  orangeDark: '#c7762f',

  // Cream variations
  creamLight: '#f0dc9f',
  creamDark: '#d4b96a',

  // Mint variations
  mintLight: '#c8e2d2',
  mintDark: '#9bc4a7',

  // Blue variations
  blueLight: '#5d7d9d',
  blueDark: '#2f4a5f',

  // Neutral colors
  white: '#FFFFFF',
  black: '#000000',
  gray: '#666666',
  lightGray: '#F5F5F5',
  darkGray: '#333333',

  // Transparent variations
  redTransparent: 'rgba(209, 55, 40, 0.1)',
  orangeTransparent: 'rgba(238, 146, 60, 0.1)',
  creamTransparent: 'rgba(230, 204, 132, 0.1)',
  mintTransparent: 'rgba(176, 218, 194, 0.1)',
  blueTransparent: 'rgba(67, 107, 136, 0.1)',
};

// Semantic color mapping
export const semanticColors = {
  primary: colors.red,
  secondary: colors.blue,
  accent: colors.orange,
  success: colors.mint,
  warning: colors.orange,
  error: colors.red,
  info: colors.blue,
  neutral: colors.cream,
};

// Gradient combinations
export const gradients = {
  primary: [colors.red, colors.orange],
  secondary: [colors.blue, colors.mint],
  warm: [colors.orange, colors.cream],
  cool: [colors.blue, colors.mint],
  sunset: [colors.red, colors.orange, colors.cream],
  ocean: [colors.blue, colors.mint, colors.cream],
};

export default colors;
