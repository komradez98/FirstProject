import React from 'react';
import { Text, View } from 'react-native';

// Simple text-based icons that work reliably
const IconMap = {
  'play': '▶',
  'pause': '⏸',
  'pausedua': '▶▌',
  'stop': '⏹',
  'step-backward': '⏮',
  'step-forward': '⏭',
  'backward': '⏪',
  'forward': '⏩',
  'volume-down': '🔉',
  'volume-up': '🔊',
  'volume-mute': '🔇',
  'plus': '＋',
  'minus': '－',
  'times': '✕',
  'close': '✕',
  'list': '≡',
  'search': '🔍',
  'music': '♪',
  'musical-note': '♫',
  'trash': '🗑',
  'delete': '🗑',
  'link': '🔗',
  'redo': '↻',
  'refresh': '↻',
  'heart': '♥',
  'star': '★',
  'check': '✓',
  'arrow-up': '↑',
  'arrow-down': '↓',
  'arrow-left': '←',
  'arrow-right': '→'
};

const Icon = ({ name, size = 20, color = '#000', style, solid = false }) => {
  const iconSymbol = IconMap[name] || '•';

  return (
    <View style={[{
      width: size,
      height: size,
      justifyContent: 'center',
      alignItems: 'center',
      flexDirection: 'row'
    }, style]}>
      <Text
        style={{
          fontSize: Math.max(size * 0.8, 16),
          color,
          textAlign: 'center',
          lineHeight: size,
          fontWeight: 'bold',
          includeFontPadding: false
        }}
      >
        {iconSymbol}
      </Text>
    </View>
  );
};

export default Icon;
