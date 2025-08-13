// Color Palette
export const colors = {
  red: '#d13728',      // (209,55,40) - Primary/Accent
  orange: '#ee923c',   // (238,146,60) - Secondary/Warning
  cream: '#e6cc84',    // (230,204,132) - Background/Neutral
  mint: '#b0dac2',     // (176,218,194) - Success/Positive
  blue: '#436b88',     // (67,107,136) - Info/Navigation

  // Additional utility colors
  white: '#FFFFFF',
  black: '#000000',
  gray: '#666666',
  lightGray: '#F5F5F5',
  darkGray: '#333333',
};

export const themes = {
  light: {
    // Backgrounds
    background: colors.white,
    surface: colors.cream,
    card: colors.white,

    // Text colors
    text: colors.black,
    textSecondary: colors.gray,
    textLight: colors.blue,

    // Primary colors
    primary: colors.red,
    primaryLight: colors.orange,
    secondary: colors.blue,

    // Status colors
    success: colors.mint,
    warning: colors.orange,
    error: colors.red,
    info: colors.blue,

    // Input colors
    inputBackground: colors.lightGray,
    inputText: colors.black,
    inputBorder: colors.gray,
    inputFocused: colors.red,

    // Button colors
    buttonPrimary: colors.red,
    buttonSecondary: colors.blue,
    buttonSuccess: colors.mint,
    buttonText: colors.white,

    // Border and shadow
    border: colors.gray,
    shadow: colors.black,
  },
  dark: {
    // Backgrounds
    background: colors.darkGray,
    surface: colors.blue,
    card: '#1E1E1E',

    // Text colors
    text: colors.orange,
    textSecondary: colors.lightGray,
    textLight: colors.cream,

    // Primary colors
    primary: colors.orange,
    primaryLight: colors.cream,
    secondary: colors.mint,

    // Status colors
    success: colors.mint,
    warning: colors.orange,
    error: colors.red,
    info: colors.blue,

    // Input colors
    inputBackground: '#2A2A2A',
    inputText: colors.white,
    inputBorder: colors.gray,
    inputFocused: colors.orange,

    // Button colors
    buttonPrimary: colors.orange,
    buttonSecondary: colors.mint,
    buttonSuccess: colors.mint,
    buttonText: colors.white,

    // Border and shadow
    border: colors.gray,
    shadow: colors.black,
  },
};
