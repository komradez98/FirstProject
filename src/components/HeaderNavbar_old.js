import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth, useTheme } from '../store';
import { themes } from '../config/theme';

const HeaderNavbar = ({ title, showBack = false, hideProfile = false, hideNavigation = false }) => {
  const navigation = useNavigation();
  const { user, logout } = useAuth();
  const { theme } = useTheme();
  const currentTheme = themes[theme];

  const handleLogout = () => {
    logout();
    navigation.navigate('Login');
  };

  // Define navigation items
  const getNavigationItems = () => {
    const baseItems = [
      { key: 'Home', icon: '🏠', label: 'Home', screen: 'Home' },
      { key: 'Book', icon: '📅', label: 'Book', screen: 'CreateOrder' },
      { key: 'Orders', icon: '📋', label: 'Orders', screen: 'CustomerOrders' },
      { key: 'Remote', icon: '📱', label: 'Remote', screen: 'Remote' },
    ];

    // Add role-specific items
    if (user?.role === 'staff' || user?.role === 'admin') {
      baseItems.push({ key: 'Staff', icon: '⚙️', label: 'Staff', screen: 'StaffOrders' });
    }
    
    baseItems.push(
      { key: 'Profile', icon: '👤', label: 'Profile', screen: 'UserProfile' },
      { key: 'Logout', icon: '🚪', label: 'Logout', action: handleLogout }
    );

    return baseItems;
  };

  return (
    <>
      <StatusBar
        backgroundColor={currentTheme.primary}
        barStyle={theme === 'light' ? 'light-content' : 'light-content'}
      />
      <SafeAreaView style={[styles.safeArea, { backgroundColor: currentTheme.primary }]}>
        <View style={[styles.header, { backgroundColor: currentTheme.primary }]}>
          {/* Left Section - Back Button */}
          <View style={styles.leftSection}>
            {showBack ? (
              <TouchableOpacity
                style={[styles.iconButton, { backgroundColor: currentTheme.primaryLight }]}
                onPress={handleBackPress}
              >
                <Text style={[styles.iconText, { color: currentTheme.buttonText }]}>←</Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.iconButton} />
            )}
          </View>

          {/* Center Section - Title */}
          <View style={styles.centerSection}>
            <Text style={[styles.title, { color: currentTheme.buttonText }]}>
              {title || 'AHA Karaoke'}
            </Text>
            {user && (
              <Text style={[styles.subtitle, { color: currentTheme.buttonText }]} numberOfLines={1}>
                Welcome, {user.name || user.username}
              </Text>
            )}
          </View>

          {/* Right Section - Profile */}
          <View style={styles.rightSection}>
            {!hideProfile && user ? (
              <TouchableOpacity
                style={[styles.profileButton, { backgroundColor: currentTheme.primaryLight }]}
                onPress={handleProfilePress}
              >
                <Text style={[styles.profileText, { color: currentTheme.buttonText }]}>
                  {(user.name || user.username || 'U').charAt(0).toUpperCase()}
                </Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.iconButton} />
            )}
          </View>
        </View>

        {/* Navigation Bar */}
        {!hideNavigation && user && (
          <View style={[styles.navbar, { backgroundColor: currentTheme.secondary }]}>
            <TouchableOpacity
              style={styles.navItem}
              onPress={() => navigation.navigate('Home')}
            >
              <Text style={[styles.navIcon, { color: currentTheme.buttonText }]}>🏠</Text>
              <Text style={[styles.navLabel, { color: currentTheme.buttonText }]}>Home</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.navItem}
              onPress={() => navigation.navigate('CreateOrder')}
            >
              <Text style={[styles.navIcon, { color: currentTheme.buttonText }]}>📅</Text>
              <Text style={[styles.navLabel, { color: currentTheme.buttonText }]}>Book</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.navItem}
              onPress={() => navigation.navigate('CustomerOrders')}
            >
              <Text style={[styles.navIcon, { color: currentTheme.buttonText }]}>📋</Text>
              <Text style={[styles.navLabel, { color: currentTheme.buttonText }]}>Orders</Text>
            </TouchableOpacity>

            {user?.role === 'staff' || user?.role === 'admin' ? (
              <TouchableOpacity
                style={styles.navItem}
                onPress={() => navigation.navigate('StaffOrders')}
              >
                <Text style={[styles.navIcon, { color: currentTheme.buttonText }]}>⚙️</Text>
                <Text style={[styles.navLabel, { color: currentTheme.buttonText }]}>Staff</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={styles.navItem}
                onPress={() => navigation.navigate('UserProfile')}
              >
                <Text style={[styles.navIcon, { color: currentTheme.buttonText }]}>👤</Text>
                <Text style={[styles.navLabel, { color: currentTheme.buttonText }]}>Profile</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={styles.navItem}
              onPress={() => navigation.navigate('Remote')}
            >
              <Text style={[styles.navIcon, { color: currentTheme.buttonText }]}>�</Text>
              <Text style={[styles.navLabel, { color: currentTheme.buttonText }]}>Remote</Text>
            </TouchableOpacity>
          </View>
        )}
      </SafeAreaView>
    </>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    minHeight: 60,
  },
  leftSection: {
    width: 50,
    alignItems: 'flex-start',
  },
  centerSection: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 10,
  },
  rightSection: {
    width: 50,
    alignItems: 'flex-end',
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconText: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 2,
    opacity: 0.9,
  },
  profileButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  navbar: {
    flexDirection: 'row',
    paddingVertical: 8,
    paddingHorizontal: 4,
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  navIcon: {
    fontSize: 20,
    marginBottom: 2,
  },
  navLabel: {
    fontSize: 10,
    fontWeight: '600',
    textAlign: 'center',
  },
});

export default HeaderNavbar;
