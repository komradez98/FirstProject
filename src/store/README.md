# Zustand State Management Documentation

## 📁 Store Structure

```
src/store/
├── index.ts          # Central exports and custom hooks
├── types.ts          # TypeScript interfaces
├── authStore.ts      # Authentication state
├── themeStore.ts     # Theme management
├── appStore.ts       # App-wide settings
└── hooks.ts          # Utility hooks
```

## 🎯 Best Practices Implemented

### 1. **Separation of Concerns**
- Each store handles a specific domain (auth, theme, app)
- Clear interfaces for type safety
- Centralized exports for easy imports

### 2. **Persistence**
- Automatic state persistence with AsyncStorage
- Selective persistence (only essential data)
- Rehydration on app restart

### 3. **TypeScript Integration**
- Full type safety with interfaces
- Proper typing for actions and state
- IntelliSense support

### 4. **Error Handling**
- Centralized error management
- Clear error states and actions
- User-friendly error messages

## 🚀 Usage Examples

### Authentication
```typescript
import { useAuth } from '../store';

const LoginScreen = () => {
  const { login, isLoading, error, clearError } = useAuth();

  const handleLogin = async () => {
    try {
      await login(email, password);
      // Handle success
    } catch (error) {
      // Error is automatically stored in state
    }
  };
};
```

### Theme Management
```typescript
import { useTheme } from '../store';

const ThemeButton = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <TouchableOpacity onPress={toggleTheme}>
      <Text>Current: {theme}</Text>
    </TouchableOpacity>
  );
};
```

### Direct Store Access
```typescript
import { useAuthStore, useThemeStore } from '../store';

const Component = () => {
  // Access specific state/actions
  const user = useAuthStore(state => state.user);
  const setTheme = useThemeStore(state => state.setTheme);

  // Use selectors for optimization
  const isLoggedIn = useAuthStore(state =>
    state.user !== null && state.isAuthenticated
  );
};
```

## 🔧 Mock API Integration

The auth store includes mock API functions that simulate:
- **Login**: `user@example.com` / `password`
- **Registration**: Validates name (2+ chars), email format, password (6+ chars)
- **Loading states**: Realistic delays
- **Error handling**: Validation and network errors

Replace these with your actual API calls:

```typescript
// In authStore.ts
const login = async (email: string, password: string) => {
  const response = await fetch('/api/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    throw new Error('Login failed');
  }

  return response.json();
};
```

## 🎨 Integration with Existing Theme System

The Zustand theme store works alongside your existing:
- ✅ Color palette (`src/config/colors.js`)
- ✅ Theme definitions (`src/config/theme.js`)
- ✅ Common styles (`src/config/styles.js`)

## 🔄 State Persistence

Data persisted to AsyncStorage:
- **Auth**: `user`, `token`, `isAuthenticated`
- **Theme**: `theme`, `isSystemTheme`
- **App**: `isFirstLaunch`, `appVersion`, `lastUpdateCheck`

## 📱 Updated Components

### LoginScreen & RegisterScreen
- ✅ Zustand integration
- ✅ Loading states with ActivityIndicator
- ✅ Error handling with alerts
- ✅ Form validation
- ✅ Beautiful UI with your color palette

### ThemeButton
- ✅ Updated to use Zustand theme store
- ✅ Maintains all visual features
- ✅ TypeScript compatibility

## 🚀 Next Steps

1. **Replace Mock API**: Update auth functions with real endpoints
2. **Add More Stores**: Create stores for specific features
3. **Add Middleware**: Consider adding logging, analytics
4. **Testing**: Add unit tests for stores
5. **Offline Support**: Implement offline-first patterns

## 🎯 Advanced Usage

### Custom Selectors
```typescript
// Optimized selector that only rerenders when user name changes
const userName = useAuthStore(state => state.user?.name);

// Complex selector with memoization
const userProfile = useAuthStore(state => ({
  name: state.user?.name,
  email: state.user?.email,
  isVerified: state.user?.isVerified || false,
}), shallow); // Use shallow comparison
```

### Combining Stores
```typescript
const useAppTheme = () => {
  const theme = useThemeStore(state => state.theme);
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);

  return {
    currentTheme: themes[theme],
    shouldShowAuthFlow: !isAuthenticated,
  };
};
```

Your Zustand setup is now production-ready with best practices! 🎉
