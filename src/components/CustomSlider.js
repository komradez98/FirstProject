import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  PanResponder,
  Dimensions,
  StyleSheet,
} from 'react-native';

const { width: screenWidth } = Dimensions.get('window');

export default function CustomSlider({
  minimumValue = 0,
  maximumValue = 100,
  value = 50,
  onValueChange,
  onSlidingComplete,
  minimumTrackTintColor = '#007AFF',
  maximumTrackTintColor = 'rgba(0,0,0,0.2)',
  thumbStyle = {},
  trackStyle = {},
  step = 1,
  style = {},
}) {
  const [currentValue, setCurrentValue] = useState(value);
  const [sliderWidth, setSliderWidth] = useState(200);
  const panResponder = useRef();

  const updateValue = (gestureX, containerWidth) => {
    const percentage = Math.max(0, Math.min(1, gestureX / containerWidth));
    const range = maximumValue - minimumValue;
    let newValue = minimumValue + (percentage * range);

    // Apply step if provided
    if (step > 0) {
      newValue = Math.round(newValue / step) * step;
    }

    // Ensure value is within bounds
    newValue = Math.max(minimumValue, Math.min(maximumValue, newValue));

    setCurrentValue(newValue);
    if (onValueChange) {
      onValueChange(newValue);
    }

    return newValue;
  };

  panResponder.current = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,

    onPanResponderGrant: (evt) => {
      const { locationX } = evt.nativeEvent;
      updateValue(locationX, sliderWidth);
    },

    onPanResponderMove: (evt) => {
      const { locationX } = evt.nativeEvent;
      updateValue(locationX, sliderWidth);
    },

    onPanResponderRelease: () => {
      if (onSlidingComplete) {
        onSlidingComplete(currentValue);
      }
    },
  });

  const getThumbPosition = () => {
    const percentage = (currentValue - minimumValue) / (maximumValue - minimumValue);
    return percentage * sliderWidth;
  };

  const onLayout = (event) => {
    const { width } = event.nativeEvent.layout;
    setSliderWidth(width);
  };

  const thumbPosition = getThumbPosition();
  const trackProgressWidth = thumbPosition;

  return (
    <View style={[styles.container, style]} onLayout={onLayout}>
      <View
        style={[styles.track, trackStyle, { backgroundColor: maximumTrackTintColor }]}
        {...panResponder.current.panHandlers}
      >
        {/* Progress track */}
        <View
          style={[
            styles.progressTrack,
            {
              width: trackProgressWidth,
              backgroundColor: minimumTrackTintColor,
            },
          ]}
        />

        {/* Thumb */}
        <View
          style={[
            styles.thumb,
            thumbStyle,
            {
              left: thumbPosition - 10, // Center the thumb (thumb width is 20)
              backgroundColor: thumbStyle.backgroundColor || minimumTrackTintColor,
            },
          ]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 40,
    justifyContent: 'center',
  },
  track: {
    height: 4,
    borderRadius: 2,
    position: 'relative',
  },
  progressTrack: {
    height: 4,
    borderRadius: 2,
    position: 'absolute',
    left: 0,
    top: 0,
  },
  thumb: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderRadius: 10,
    top: -8, // Center vertically on the track
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
});
