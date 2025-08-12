import React, { createContext, useState, useContext } from 'react';
import { themes } from '../config/theme';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [themeName, setThemeName] = useState('light');
  const theme = themes[themeName];

  const toggleTheme = () => {
    setThemeName(prev => (prev === 'light' ? 'dark' : 'light'));
  };

  return (
    <ThemeContext.Provider value={{ theme, themeName, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
