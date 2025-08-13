import React from 'react';
import {
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
  View,
} from 'react-native';

import { useTheme } from '../store';
import { colors } from '../config/colors';

interface ThemeButtonProps {
  style?: ViewStyle;
  size?: 'small' | 'medium' | 'large';
  position?: 'absolute' | 'relative';
  top?: number;
  right?: number;
  left?: number;
  bottom?: number;
}

const ThemeButton: React.FC<ThemeButtonProps> = ({
  style,
  size = 'medium',
  position = 'absolute',
  top = 20,
  right = 20,
  left,
  bottom,
}) => {
  const { theme, toggleTheme } = useTheme();

  const buttonSize = {
    small: 40,
    medium: 50,
    large: 60,
  };

  const iconSize = {
    small: 20,
    medium: 25,
    large: 30,
  };

  const currentSize = buttonSize[size];
  const currentIconSize = iconSize[size];

  const positionStyle: ViewStyle = position === 'absolute' ? {
    position: 'absolute',
    top,
    right,
    left,
    bottom,
  } : {};

  return (
    <TouchableOpacity
      style={[
        styles.button,
        {
          width: currentSize,
          height: currentSize,
          borderRadius: currentSize / 2,
          backgroundColor: theme === 'light' ? colors.blue : colors.orange,
          shadowColor: colors.black,
        },
        positionStyle,
        style,
      ]}
      onPress={toggleTheme}
      activeOpacity={0.8}
    >
      <View style={styles.iconContainer}>
        {theme === 'light' ? (
          <View style={[styles.moonIcon, {
            width: currentIconSize,
            height: currentIconSize,
            backgroundColor: colors.white,
          }]}>
            <View style={[styles.moonCrater, {
              backgroundColor: theme === 'light' ? colors.blue : colors.orange,
            }]} />
          </View>
        ) : (
          <View style={styles.sunContainer}>
            <View style={[styles.sunIcon, {
              width: currentIconSize * 0.6,
              height: currentIconSize * 0.6,
              backgroundColor: colors.white,
            }]} />
            {/* Sun rays */}
            {[...Array(8)].map((_, index) => (
              <View
                key={index}
                style={[
                  styles.sunRay,
                  {
                    backgroundColor: colors.white,
                    transform: [{ rotate: `${index * 45}deg` }],
                    width: currentIconSize * 0.15,
                    height: currentIconSize * 0.4,
                  },
                ]}
              />
            ))}
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  iconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    height: '100%',
  },
  moonIcon: {
    borderRadius: 50,
    position: 'relative',
  },
  moonCrater: {
    position: 'absolute',
    width: '30%',
    height: '30%',
    borderRadius: 50,
    top: '20%',
    right: '20%',
  },
  sunContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  sunIcon: {
    borderRadius: 50,
  },
  sunRay: {
    position: 'absolute',
    borderRadius: 2,
  },
});

export default ThemeButton;