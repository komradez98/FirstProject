import React from 'react';
import { TouchableOpacity, Text, Alert } from 'react-native';
import { useTheme } from '../store';
import { themes } from '../config/theme';
import { commonStyles } from '../config/styles';

interface ForgotPasswordLinkProps {
  onPress?: () => void;
  style?: object;
  textStyle?: object;
}

const ForgotPasswordLink: React.FC<ForgotPasswordLinkProps> = ({
  onPress,
  style,
  textStyle,
}) => {
  const { theme } = useTheme();
  const currentTheme = themes[theme];

  const handlePress = () => {
    if (onPress) {
      onPress();
    } else {
      // Default behavior - show alert for now
      Alert.alert(
        'Reset Password',
        'Belum di wiring.',
        [{ text: 'OK' }]
      );
    }
  };

  return (
    <TouchableOpacity
      style={[{ marginTop: 16 }, style]}
      onPress={handlePress}
    >
      <Text
        style={[
          commonStyles.smallText,
          {
            color: currentTheme.primary,
            textAlign: 'center',
            textDecorationLine: 'underline',
          },
          textStyle,
        ]}
      >
        Forgot Password?
      </Text>
    </TouchableOpacity>
  );
};

export default ForgotPasswordLink;