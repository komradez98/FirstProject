import React from 'react';
import { TouchableOpacity, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../store';
import { themes } from '../config/theme';

export default function FloatingHomeButton({
  position = 'bottom-right',
  size = 'medium',
  style,
  showOnHome = false
}) {
  const navigation = useNavigation();
  const { theme } = useTheme();
  const currentTheme = themes[theme];

  // Get current route name
  const currentRoute = navigation.getState()?.routes[navigation.getState()?.index]?.name;

  // Don't show on Home screen unless explicitly requested
  if (currentRoute === 'Home' && !showOnHome) {
    return null;
  }

  const handlePress = () => {
    navigation.navigate('Home');
  };

  const getPositionStyle = () => {
    const baseDistance = 20;
    const positions = {
      'top-left': { top: baseDistance + 40, left: baseDistance },
      'top-right': { top: baseDistance + 40, right: baseDistance },
      'bottom-left': { bottom: baseDistance + 20, left: baseDistance },
      'bottom-right': { bottom: baseDistance + 20, right: baseDistance },
      'bottom-center': { bottom: baseDistance + 20, alignSelf: 'center', left: '50%', marginLeft: -27.5 },
    };
    return positions[position] || positions['bottom-right'];
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return {
          width: 45,
          height: 45,
          borderRadius: 22.5,
        };
      case 'large':
        return {
          width: 65,
          height: 65,
          borderRadius: 32.5,
        };
      default: // medium
        return {
          width: 55,
          height: 55,
          borderRadius: 27.5,
        };
    }
  };

  const getIconSize = () => {
    switch (size) {
      case 'small':
        return 16;
      case 'large':
        return 24;
      default:
        return 20;
    }
  };

  return (
    <TouchableOpacity
      style={[
        styles.floatingButton,
        getSizeStyles(),
        getPositionStyle(),
        {
          backgroundColor: currentTheme.primary,
          shadowColor: currentTheme.shadow || '#000',
        },
        style
      ]}
      onPress={handlePress}
      activeOpacity={0.8}
    >
      <Text style={[styles.icon, { fontSize: getIconSize(), color: currentTheme.buttonText }]}>
        🏠
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  floatingButton: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 10,
    shadowOffset: {
      width: 0,
      height: 5,
    },
    shadowOpacity: 0.34,
    shadowRadius: 6.27,
    zIndex: 1000,
  },
  icon: {
    fontWeight: 'bold',
  },
});
