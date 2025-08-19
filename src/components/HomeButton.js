import React from 'react';
import { TouchableOpacity, StyleSheet, View, Text } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../store';
import { themes } from '../config/theme';
import { commonStyles } from '../config/styles';

export default function HomeButton({ style, size = 'medium', showLabel = true, variant = 'filled' }) {
  const navigation = useNavigation();
  const { theme } = useTheme();
  const currentTheme = themes[theme];

  const handlePress = () => {
    navigation.navigate('Home');
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return {
          paddingVertical: 8,
          paddingHorizontal: 16,
          minWidth: 80,
        };
      case 'large':
        return {
          paddingVertical: 16,
          paddingHorizontal: 32,
          minWidth: 120,
        };
      default: // medium
        return {
          paddingVertical: 12,
          paddingHorizontal: 24,
          minWidth: 100,
        };
    }
  };

  const getTextSize = () => {
    switch (size) {
      case 'small':
        return 14;
      case 'large':
        return 18;
      default:
        return 16;
    }
  };

  const getButtonStyles = () => {
    const baseStyles = [
      styles.button,
      getSizeStyles(),
      {
        shadowColor: currentTheme.shadow || '#000',
      }
    ];

    if (variant === 'outlined') {
      return [
        ...baseStyles,
        {
          backgroundColor: 'transparent',
          borderWidth: 2,
          borderColor: currentTheme.primary,
        }
      ];
    }

    return [
      ...baseStyles,
      {
        backgroundColor: currentTheme.primary,
      }
    ];
  };

  const getTextColor = () => {
    return variant === 'outlined' ? currentTheme.primary : currentTheme.buttonText;
  };

  return (
    <TouchableOpacity
      style={[getButtonStyles(), style]}
      onPress={handlePress}
      activeOpacity={0.8}
    >
      <View style={styles.buttonContent}>
        <Text style={[styles.icon, { fontSize: getTextSize(), color: getTextColor() }]}>
          🏠
        </Text>
        {showLabel && (
          <Text style={[styles.label, { fontSize: getTextSize(), color: getTextColor() }]}>
            {' '}Home
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    width: '100%',
    elevation: 4,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 3.84,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    fontWeight: 'bold',
  },
  label: {
    fontWeight: '600',
  },
});
