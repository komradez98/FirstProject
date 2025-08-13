import React, { useState } from 'react';
import {
  View,
  TouchableOpacity,
  Text,
  TextInput,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useAuth, useTheme } from '../store';
import { themes } from '../config/theme';
import { commonStyles } from '../config/styles';
import ThemeButton from '../components/ThemeButton';
import ForgotPasswordLink from '../components/ForgotPasswordLink';

export default function LoginScreen({ navigation }) {
  const { login, isLoading, error, clearError } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Get current theme styles
  const currentTheme = themes[theme];

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    try {
      clearError(); // Clear any previous errors
      await login(email.trim(), password);
      Alert.alert('Success', 'Login successful!');
      // Navigation to main app would happen here
    } catch (error) {
      Alert.alert('Login Failed', error.message || 'Please try again');
    }
  };

  return (
    <View
      style={[
        commonStyles.authContainer,
        { backgroundColor: currentTheme.background },
      ]}
    >
      <Text style={[commonStyles.authTitle, { color: currentTheme.text }]}>
        Welcome Back
      </Text>

      {error && (
        <View style={[commonStyles.errorBadge, { marginBottom: 16 }]}>
          <Text style={commonStyles.badgeText}>{error}</Text>
        </View>
      )}

      <View style={commonStyles.formGroup}>
        <Text style={[commonStyles.label, { color: currentTheme.text }]}>
          Email
        </Text>
        <TextInput
          placeholder="Enter your email"
          placeholderTextColor={currentTheme.textSecondary}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          style={[
            commonStyles.input,
            {
              backgroundColor: currentTheme.inputBackground,
              color: currentTheme.inputText,
              borderColor: currentTheme.inputBorder,
            },
          ]}
        />
      </View>

      <View style={commonStyles.formGroup}>
        <Text style={[commonStyles.label, { color: currentTheme.text }]}>
          Password
        </Text>
        <TextInput
          placeholder="Enter your password"
          placeholderTextColor={currentTheme.textSecondary}
          secureTextEntry
          value={password}
          onChangeText={setPassword}
          style={[
            commonStyles.input,
            {
              backgroundColor: currentTheme.inputBackground,
              color: currentTheme.inputText,
              borderColor: currentTheme.inputBorder,
            },
          ]}
        />
      </View>

      <TouchableOpacity
        style={[
          commonStyles.buttonPrimary,
          {
            backgroundColor: currentTheme.primary,
            opacity: isLoading ? 0.7 : 1,
          },
        ]}
        onPress={handleLogin}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator size="small" color={currentTheme.buttonText} />
        ) : (
          <Text
            style={[
              commonStyles.buttonText,
              { color: currentTheme.buttonText },
            ]}
          >
            Login
          </Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          commonStyles.buttonOutline,
          { borderColor: currentTheme.primary, marginTop: 16 },
        ]}
        onPress={() => navigation.navigate('Register')}
      >
        <Text
          style={[
            commonStyles.buttonTextOutline,
            { color: currentTheme.primary },
          ]}
        >
          Create Account
        </Text>
      </TouchableOpacity>

      <ForgotPasswordLink />

      <ThemeButton size="medium" top={50} right={20} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 20 },
  title: { fontSize: 24, marginBottom: 20, textAlign: 'center' },
  input: { padding: 10, borderRadius: 5, marginBottom: 10 },
  circleButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#3498db',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    elevation: 5,
  },
  linkText: {
    marginTop: 10,
    marginBottom: 2,
    textAlign: 'center',
    textDecorationLine: 'underline',
  },
});
