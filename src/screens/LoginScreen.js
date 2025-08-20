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
import { CommonActions } from '@react-navigation/native';
import { useAuth, useTheme } from '../store';
import { themes } from '../config/theme';
import { commonStyles } from '../config/styles';
import ThemeButton from '../components/ThemeButton';
import ForgotPasswordLink from '../components/ForgotPasswordLink';
import { testAPI } from '../utils/apiTest';

export default function LoginScreen({ navigation }) {
  const { login, isLoading, error, clearError } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [emailOrUsername, setEmailOrUsername] = useState('');
  const [password, setPassword] = useState('');

  // Get current theme styles
  const currentTheme = themes[theme];

  const handleLogin = async () => {
    if (!emailOrUsername.trim() || !password.trim()) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    try {
      clearError(); // Clear any previous errors
      await login(emailOrUsername.trim(), password);


      // Use reset navigation to ensure clean navigation state
      navigation.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [{ name: 'Home' }],
        })
      );

      // Show success message after navigation
      setTimeout(() => {
        Alert.alert('Success', 'Login successful!');
      }, 100);
    } catch (error) {
      console.log('📱 Login failed:', error.message);
      Alert.alert('Login Failed', error.message || 'Please try again');
    }
  };

  const testConnection = async () => {
    Alert.alert('Testing Connection', 'Checking API connection...');
    const isConnected = await testAPI.ping();
    if (isConnected) {
      Alert.alert('Success', 'API connection successful!');
    } else {
      Alert.alert('Error', 'Cannot connect to API. Check if backend is running.');
    }
  };

  const testNavigation = () => {
    console.log('📱 Testing navigation to UserProfile...');
    navigation.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [{ name: 'UserProfile' }],
      })
    );
  };

  return (
    <View
      style={[
        commonStyles.loginContainer,
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
          Email or Username
        </Text>
        <TextInput
          placeholder="Enter your email or username"
          placeholderTextColor={currentTheme.textSecondary}
          value={emailOrUsername}
          onChangeText={setEmailOrUsername}
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
  // Remove unused styles, using commonStyles instead
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
