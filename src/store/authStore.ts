import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthStore, User } from './types';

// Mock API functions - replace with your actual API calls
const mockLogin = async (email: string, password: string): Promise<{ user: User; token: string }> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Mock validation
  if (email === 'user@example.com' && password === 'password') {
    return {
      user: {
        id: '1',
        name: 'Blonde',
        email: email,
        avatar: 'https://via.placeholder.com/150',
        createdAt: new Date().toISOString(),
      },
      token: 'tokenBoongan' + Date.now(),
    };
  } else {
    throw new Error('Invalid email or password');
  }
};

const mockRegister = async (name: string, email: string, password: string): Promise<{ user: User; token: string }> => {
  await new Promise(resolve => setTimeout(resolve, 1200));

  if (name.length < 2) {
    throw new Error('Name must be at least 2 characters');
  }
  if (!email.includes('@')) {
    throw new Error('Please enter a valid email');
  }
  if (password.length < 6) {
    throw new Error('Password must be at least 6 characters');
  }

  return {
    user: {
      id: Date.now().toString(),
      name: name,
      email: email,
      createdAt: new Date().toISOString(),
    },
    token: 'mock-jwt-token-' + Date.now(),
  };
};

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      // Initial state
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      // Actions
      login: async (email: string, password: string) => {
        set({ isLoading: true, error: null });

        try {
          const { user, token } = await mockLogin(email, password);
          set({
            user,
            token,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Login failed',
            isLoading: false,
          });
          throw error;
        }
      },

      register: async (name: string, email: string, password: string) => {
        set({ isLoading: true, error: null });

        try {
          const { user, token } = await mockRegister(name, email, password);
          set({
            user,
            token,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Registration failed',
            isLoading: false,
          });
          throw error;
        }
      },

      logout: () => {
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          error: null,
        });
      },

      clearError: () => {
        set({ error: null });
      },

      setLoading: (loading: boolean) => {
        set({ isLoading: loading });
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => AsyncStorage),
      // Only persist essential data
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
