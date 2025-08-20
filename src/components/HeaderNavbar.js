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
        {/* Simplified Header */}
        <View style={[styles.header, { backgroundColor: currentTheme.primary }]}>
          {/* Left Section - Back Button */}
          {showBack && (
            <TouchableOpacity
              style={[styles.backButton, { backgroundColor: currentTheme.primaryLight }]}
              onPress={() => {
                if (navigation.canGoBack()) {
                  navigation.goBack();
                } else {
                  navigation.navigate('Home');
                }
              }}
            >
              <Text style={[styles.backIcon, { color: currentTheme.buttonText }]}>←</Text>
            </TouchableOpacity>
          )}

          {/* Center Section - Title */}
          <View style={[styles.titleContainer, showBack && styles.titleWithBack]}>
            <Text style={[styles.title, { color: currentTheme.buttonText }]}>
              {title || 'AHA Karaoke'}
            </Text>
          </View>

          {/* Right Section - Profile (only if not hiding profile and user exists) */}
          {!hideProfile && user && (
            <TouchableOpacity
              style={[styles.profileButton, { backgroundColor: currentTheme.primaryLight }]}
              onPress={() => navigation.navigate('UserProfile')}
            >
              <Text style={[styles.profileText, { color: currentTheme.buttonText }]}>
                {(user.name || user.username || 'U').charAt(0).toUpperCase()}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Horizontal Scrollable Navigation Bar */}
        {!hideNavigation && user && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={[styles.navbarContainer, { backgroundColor: currentTheme.secondary }]}
            contentContainerStyle={styles.navbarContent}
          >
            {getNavigationItems().map((item) => (
              <TouchableOpacity
                key={item.key}
                style={styles.navItem}
                onPress={() => {
                  if (item.action) {
                    item.action();
                  } else if (item.screen) {
                    navigation.navigate(item.screen);
                  }
                }}
              >
                <Text style={[styles.navIcon, { color: currentTheme.buttonText }]}>
                  {item.icon}
                </Text>
                <Text style={[styles.navLabel, { color: currentTheme.buttonText }]}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
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
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  backIcon: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  titleContainer: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 10,
  },
  titleWithBack: {
    alignItems: 'flex-start',
    paddingLeft: 0,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  profileButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  profileText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  navbarContainer: {
    maxHeight: 70,
  },
  navbarContent: {
    paddingHorizontal: 8,
    paddingVertical: 8,
    alignItems: 'center',
  },
  navItem: {
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginHorizontal: 4,
    minWidth: 60,
    borderRadius: 8,
  },
  navIcon: {
    fontSize: 20,
    marginBottom: 4,
  },
  navLabel: {
    fontSize: 10,
    fontWeight: '600',
    textAlign: 'center',
  },
});

export default HeaderNavbar;
