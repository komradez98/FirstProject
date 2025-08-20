// Central export file for all stores
export { useAuthStore } from './authStore';
export { useThemeStore } from './themeStore';
export { useAppStore } from './appStore';

// Export types
export type {
  User,
  AuthState,
  AuthActions,
  AuthStore,
  ThemeState,
  ThemeActions,
  ThemeStore,
  AppState,
  AppActions,
  AppStore,
} from './types';

// Import stores for custom hooks
import { useAuthStore } from './authStore';
import { useThemeStore } from './themeStore';
import { useAppStore } from './appStore';
export { useSongsStore } from './songsStore';
// Custom hooks for common use cases
export const useAuth = () => {
  const authStore = useAuthStore();
  return {
    user: authStore.user,
    isAuthenticated: authStore.isAuthenticated,
    isLoading: authStore.isLoading,
    error: authStore.error,
    login: authStore.login,
    register: authStore.register,
    logout: authStore.logout,

    clearError: authStore.clearError,
  };
};

export const useTheme = () => {
  const themeStore = useThemeStore();
  return {
    theme: themeStore.theme,
    isSystemTheme: themeStore.isSystemTheme,
    setTheme: themeStore.setTheme,
    toggleTheme: themeStore.toggleTheme,
    setSystemTheme: themeStore.setSystemTheme,
  };
};

export const useApp = () => {
  const appStore = useAppStore();
  return {
    isFirstLaunch: appStore.isFirstLaunch,
    appVersion: appStore.appVersion,
    lastUpdateCheck: appStore.lastUpdateCheck,
    setFirstLaunch: appStore.setFirstLaunch,
    setAppVersion: appStore.setAppVersion,
    setLastUpdateCheck: appStore.setLastUpdateCheck,
  };
};
