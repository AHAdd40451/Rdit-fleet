import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ActivityIndicator } from 'react-native';

const TEAL_GREEN = '#14AB98';
const BRIGHT_GREEN = '#B0E56D';

interface LoadingBarProps {
  variant?: 'bar' | 'spinner' | 'both';
  size?: 'small' | 'large';
  style?: ViewStyle;
  overlay?: boolean;
}

export const LoadingBar: React.FC<LoadingBarProps> = ({
  variant = 'spinner',
  size = 'small',
  style,
  overlay = false,
}) => {
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (variant === 'bar' || variant === 'both') {
      // Animate the loading bar
      const animation = Animated.loop(
        Animated.sequence([
          Animated.timing(progress, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: false,
          }),
          Animated.timing(progress, {
            toValue: 0,
            duration: 1000,
            useNativeDriver: false,
          }),
        ])
      );
      animation.start();
      return () => animation.stop();
    }
  }, [variant, progress]);

  const width = progress.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  const containerStyle = overlay
    ? [styles.overlayContainer, style]
    : [styles.container, style];

  return (
    <View style={containerStyle}>
      {variant === 'bar' || variant === 'both' ? (
        <View style={styles.barContainer}>
          <View style={styles.barBackground}>
            <Animated.View style={[styles.barFill, { width }]}>
              <LinearGradient
                colors={[TEAL_GREEN, BRIGHT_GREEN]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.gradient}
              />
            </Animated.View>
          </View>
        </View>
      ) : null}
      
      {variant === 'spinner' || variant === 'both' ? (
        <View style={styles.spinnerContainer}>
          <ActivityIndicator
            size={size}
            color={TEAL_GREEN}
            style={styles.spinner}
          />
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  overlayContainer: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    zIndex: 999,
  },
  barContainer: {
    width: '100%',
    maxWidth: 300,
    marginBottom: 16,
  },
  barBackground: {
    height: 4,
    backgroundColor: '#E0E0E0',
    borderRadius: 2,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 2,
  },
  gradient: {
    flex: 1,
    width: '100%',
  },
  spinnerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  spinner: {
    marginTop: 8,
  },
});

