import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ThemeStore } from './types';

export const useThemeStore = create<ThemeStore>()(
  persist(
    (set, get) => ({
      // Initial state
      theme: 'light',
      isSystemTheme: false,

      // Actions
      setTheme: (theme: 'light' | 'dark') => {
        set({ theme, isSystemTheme: false });
      },

      toggleTheme: () => {
        const currentTheme = get().theme;
        set({
          theme: currentTheme === 'light' ? 'dark' : 'light',
          isSystemTheme: false
        });
      },

      setSystemTheme: (enabled: boolean) => {
        set({ isSystemTheme: enabled });
        if (enabled) {
          set({ theme: 'light' });
        }
      },
    }),
    {
      name: 'theme-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
