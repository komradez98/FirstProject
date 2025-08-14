// Types for the store
export interface User {
  id: string;
  name: string;
  username: string;
  email: string;
  noHandphone?: string;
  role: 'customer' | 'admin' | 'staff';
  isActive: boolean;
  emailVerified: boolean;
  lastLogin?: string;
  createdAt: string;
  updatedAt: string;
  avatar?: string; // Optional for profile picture
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface AuthActions {
  login: (emailOrUsername: string, password: string) => Promise<void>;
  register: (name: string, username: string, email: string, password: string, noHandphone: string) => Promise<void>;
  logout: () => void;
  clearError: () => void;
  setLoading: (loading: boolean) => void;
}

export interface ThemeState {
  theme: 'light' | 'dark';
  isSystemTheme: boolean;
}

export interface ThemeActions {
  setTheme: (theme: 'light' | 'dark') => void;
  toggleTheme: () => void;
  setSystemTheme: (enabled: boolean) => void;
}

export interface AppState {
  isFirstLaunch: boolean;
  appVersion: string;
  lastUpdateCheck: string | null;
}

export interface AppActions {
  setFirstLaunch: (isFirst: boolean) => void;
  setAppVersion: (version: string) => void;
  setLastUpdateCheck: (date: string) => void;
}

// Combined store types
export type AuthStore = AuthState & AuthActions;
export type ThemeStore = ThemeState & ThemeActions;
export type AppStore = AppState & AppActions;
