import { useEffect, useState } from 'react';
import { useAuthStore } from './authStore';
import { useThemeStore } from './themeStore';

// Hook for authentication persistence
export const useAuthPersistence = () => {
  const { token, isAuthenticated, logout } = useAuthStore();

  useEffect(() => {
    if (token && isAuthenticated) {
      console.log('User is authenticated');
    }
  }, [token, isAuthenticated]);


  const checkAuthStatus = () => {
    return token && isAuthenticated;
  };

  return {
    isLoggedIn: checkAuthStatus(),
    logout,
  };
};


export const useThemePersistence = () => {
  const { theme, isSystemTheme, setTheme } = useThemeStore();

  useEffect(() => {
    if (isSystemTheme) {
      console.log('System theme enabled, detecting...');
    }
  }, [isSystemTheme]);

  return {
    currentTheme: theme,
    isSystemTheme,
    setTheme,
  };
};

// Hook for form validation with Zustand
export const useFormStore = <T extends Record<string, any>>(initialState: T) => {
  const [formData, setFormData] = useState<T>(initialState);
  const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const updateField = (field: keyof T, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const setFieldError = (field: keyof T, error: string) => {
    setErrors(prev => ({ ...prev, [field]: error }));
  };

  const clearErrors = () => {
    setErrors({});
  };

  const resetForm = () => {
    setFormData(initialState);
    setErrors({});
    setIsSubmitting(false);
  };

  return {
    formData,
    errors,
    isSubmitting,
    updateField,
    setFieldError,
    clearErrors,
    resetForm,
    setIsSubmitting,
  };
};

// Global error handling hook
export const useErrorHandler = () => {
  const { error: authError, clearError: clearAuthError } = useAuthStore();

  const handleError = (error: unknown, context?: string) => {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    console.error(`Error in ${context || 'unknown context'}:`, errorMessage);

    // Here you could integrate with crash reporting services
    // like Crashlytics, Sentry, etc.
  };

  const clearAllErrors = () => {
    clearAuthError();
  };

  return {
    authError,
    handleError,
    clearAllErrors,
  };
};
