import React, { createContext, useState, useContext } from 'react';
import { themes } from '../config/theme';
import { colors, semanticColors } from '../config/colors';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [themeName, setThemeName] = useState('light');
  const theme = themes[themeName];

  const toggleTheme = () => {
    setThemeName(prev => (prev === 'light' ? 'dark' : 'light'));
  };

  return (
    <ThemeContext.Provider value={{
      theme,
      themeName,
      toggleTheme,
      colors,
      semanticColors
    }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

// Hook to get colors directly
export const useColors = () => {
  const { colors, semanticColors } = useTheme();
  return { colors, semanticColors };
};
