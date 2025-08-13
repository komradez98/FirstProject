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

export default function RegisterScreen({ navigation }) {
  const { register, isLoading, error, clearError } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Get current theme styles
  const currentTheme = themes[theme];

  const handleRegister = async () => {
    if (!name.trim() || !email.trim() || !password.trim()) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    try {
      clearError(); // Clear any previous errors
      await register(name.trim(), email.trim(), password);
      Alert.alert('Success', 'Account created successfully!');
      // Navigation to main app would happen here
    } catch (error) {
      Alert.alert('Registration Failed', error.message || 'Please try again');
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
        Create Account
      </Text>

      {error && (
        <View style={[commonStyles.errorBadge, { marginBottom: 16 }]}>
          <Text style={commonStyles.badgeText}>{error}</Text>
        </View>
      )}

      <View style={commonStyles.formGroup}>
        <Text style={[commonStyles.label, { color: currentTheme.text }]}>
          Full Name
        </Text>
        <TextInput
          placeholder="Enter your full name"
          placeholderTextColor={currentTheme.textSecondary}
          value={name}
          onChangeText={setName}
          autoCapitalize="words"
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
          placeholder="Create a password (min 6 characters)"
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
        onPress={handleRegister}
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
            Create Account
          </Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          commonStyles.buttonOutline,
          { borderColor: currentTheme.primary, marginTop: 16 },
        ]}
        onPress={() => navigation.navigate('Login')}
      >
        <Text
          style={[
            commonStyles.buttonTextOutline,
            { color: currentTheme.primary },
          ]}
        >
          Already have an account? Login
        </Text>
      </TouchableOpacity>

      <ForgotPasswordLink
        style={{ marginTop: 12 }}
        onPress={() => {
          // Custom action for register screen - could navigate to forgot password
          navigation.navigate('Login'); // Navigate to login where they can use forgot password
        }}
      />

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
