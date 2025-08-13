import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppStore } from './types';

export const useAppStore = create<AppStore>()(
  persist(
    (set, get) => ({
      // Initial state
      isFirstLaunch: true,
      appVersion: '1.0.0',
      lastUpdateCheck: null,

      // Actions
      setFirstLaunch: (isFirst: boolean) => {
        set({ isFirstLaunch: isFirst });
      },

      setAppVersion: (version: string) => {
        set({ appVersion: version });
      },

      setLastUpdateCheck: (date: string) => {
        set({ lastUpdateCheck: date });
      },
    }),
    {
      name: 'app-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
