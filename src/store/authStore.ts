import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthStore, User } from './types';
import axios from 'axios';
import { config } from '../config/envConfig';

const API_BASE_URL = config.baseURL;

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    const state = useAuthStore.getState();
    if (state.token) {
      config.headers.Authorization = `Bearer ${state.token}`;
      config.headers.access_token = state.token;
    } else {
      // No token available
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().logout();
    }
    return Promise.reject(error);
  }
);

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      // Initial state
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      login: async (emailOrUsername: string, password: string) => {
        set({ isLoading: true, error: null });

        try {
          const response = await api.post('/login', {
            emailOrUsername,
            password,
          });

          const { user, access_token } = response.data.data;

          api.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
          api.defaults.headers.common['access_token'] = access_token;

          set({
            user,
            token: access_token,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });

        } catch (error: any) {
          const errorMessage = error.response?.data?.message || error.message || 'Login failed';
          set({
            error: errorMessage,
            isLoading: false,
          });
          throw new Error(errorMessage);
        }
      },

      register: async (name: string, username: string, email: string, password: string, noHandphone: string) => {
        set({ isLoading: true, error: null });

        try {
          const response = await api.post('/register', {
            name,
            username,
            email,
            password,
            noHandphone,
          });

          const { user, access_token } = response.data.data;

          api.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
          api.defaults.headers.common['access_token'] = access_token;

          set({
            user,
            token: access_token,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });

        } catch (error: any) {
          const errorMessage = error.response?.data?.message || error.message || 'Registration failed';
          set({
            error: errorMessage,
            isLoading: false,
          });
          throw new Error(errorMessage);
        }
      },

      logout: async () => {
        try {
          const { token } = get();
          if (token) {
            await api.post('/logout');
          }
        } catch (error) {
          // No return apa2
        } finally {
          // bersihin token
          delete api.defaults.headers.common['Authorization'];
          delete api.defaults.headers.common['access_token'];

          set({
            user: null,
            token: null,
            isAuthenticated: false,
            error: null,
          });

        }
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
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),

      // refresh token fitur
      onRehydrateStorage: () => (state) => {
        if (state?.token) {
          api.defaults.headers.common['Authorization'] = `Bearer ${state.token}`;
          api.defaults.headers.common['access_token'] = state.token;
        } else {

        }
      },
    }
  )
);

export { api };
