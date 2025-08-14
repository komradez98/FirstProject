import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useAuth, useTheme } from '../store';
import { themes } from '../config/theme';
import { commonStyles } from '../config/styles';
import { testApiConnection, debugAuthHeaders } from '../utils/orderUtils';

export default function UserProfile({ navigation }) {
  const { user, logout, isAuthenticated } = useAuth();
  const { theme } = useTheme();
  const currentTheme = themes[theme];

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            await logout();
            Alert.alert('Success', 'Logged out successfully', [
              {
                text: 'OK',
                onPress: () => navigation.navigate('Login')
              }
            ]);
          },
        },
      ]
    );
  };

  const handleTestApiConnection = async () => {
    Alert.alert(
      'Testing API Connection',
      'This will test if your authentication token is working properly.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Test',
          onPress: async () => {
            const result = await testApiConnection();
            if (result.success) {
              Alert.alert('✅ Success', 'API connection is working properly with your token!');
            } else {
              Alert.alert('❌ Failed', `API connection failed: ${result.error}`);
            }
          },
        },
      ]
    );
  };

  if (!isAuthenticated || !user) {
    return (
      <View style={[styles.container, { backgroundColor: currentTheme.background }]}>
        <Text style={[styles.title, { color: currentTheme.text }]}>
          Please login to continue
        </Text>
        <TouchableOpacity
          style={[
            commonStyles.buttonPrimary,
            { backgroundColor: currentTheme.primary },
          ]}
          onPress={() => navigation.navigate('Login')}
        >
          <Text style={[commonStyles.buttonText, { color: currentTheme.buttonText }]}>
            Go to Login
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: currentTheme.background }]}>
      <Text style={[styles.title, { color: currentTheme.text }]}>
        Welcome, {user.name}!
      </Text>

      <View style={styles.userInfo}>
        <Text style={[styles.label, { color: currentTheme.text }]}>User Information:</Text>
        <Text style={[styles.info, { color: currentTheme.textSecondary }]}>
          ID: {user.id}
        </Text>
        <Text style={[styles.info, { color: currentTheme.textSecondary }]}>
          Username: {user.username}
        </Text>
        <Text style={[styles.info, { color: currentTheme.textSecondary }]}>
          Email: {user.email}
        </Text>
        <Text style={[styles.info, { color: currentTheme.textSecondary }]}>
          Phone: {user.noHandphone || 'Not provided'}
        </Text>
        <Text style={[styles.info, { color: currentTheme.textSecondary }]}>
          Role: {user.role}
        </Text>
        <Text style={[styles.info, { color: currentTheme.textSecondary }]}>
          Active: {user.isActive ? 'Yes' : 'No'}
        </Text>
        <Text style={[styles.info, { color: currentTheme.textSecondary }]}>
          Email Verified: {user.emailVerified ? 'Yes' : 'No'}
        </Text>
        <Text style={[styles.info, { color: currentTheme.textSecondary }]}>
          Member Since: {new Date(user.createdAt).toLocaleDateString()}
        </Text>
        {user.lastLogin && (
          <Text style={[styles.info, { color: currentTheme.textSecondary }]}>
            Last Login: {new Date(user.lastLogin).toLocaleString()}
          </Text>
        )}
      </View>

      {/* Navigation Buttons */}
      <View style={styles.navigationSection}>
        <TouchableOpacity
          style={[
            commonStyles.buttonSecondary,
            { backgroundColor: currentTheme.secondary, marginBottom: 12 },
          ]}
          onPress={() => {
            if (user.role === 'customer') {
              navigation.navigate('CustomerOrders');
            } else {
              navigation.navigate('StaffOrders');
            }
          }}
        >
          <Text style={[commonStyles.buttonText, { color: currentTheme.buttonText }]}>
            {user.role === 'customer' ? 'My Orders' : 'Manage Orders'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            commonStyles.buttonOutline,
            {
              borderColor: currentTheme.info,
              marginBottom: 12,
            },
          ]}
          onPress={handleTestApiConnection}
        >
          <Text style={[commonStyles.buttonTextOutline, { color: currentTheme.info }]}>
            Test API Connection
          </Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={[
          commonStyles.buttonPrimary,
          { backgroundColor: 'red', marginTop: 20 },
        ]}
        onPress={handleLogout}
      >
        <Text style={[commonStyles.buttonText, { color: 'white' }]}>
          Logout
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  userInfo: {
    backgroundColor: 'rgba(0,0,0,0.1)',
    padding: 16,
    borderRadius: 8,
    marginBottom: 20,
  },
  label: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  info: {
    fontSize: 14,
    marginBottom: 5,
  },
  navigationSection: {
    marginVertical: 16,
  },
});
