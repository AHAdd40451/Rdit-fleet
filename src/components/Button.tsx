import React from 'react';
import { Text, TouchableOpacity, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const TEAL_GREEN = '#26A69A';
const BRIGHT_GREEN = '#66BB6A';

interface ButtonProps {
  variant?: 'gradient' | 'default';
  title: string;
  onPress: () => void;
  activeOpacity?: number;
  style?: ViewStyle;
  textStyle?: TextStyle;
  disabled?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'default',
  title,
  onPress,
  activeOpacity = 0.8,
  style,
  textStyle,
  disabled = false,
}) => {
  if (variant === 'gradient') {
    return (
      <TouchableOpacity
        style={[styles.buttonContainer, style]}
        onPress={onPress}
        activeOpacity={activeOpacity}
        disabled={disabled}
      >
        <LinearGradient
          colors={[TEAL_GREEN, BRIGHT_GREEN]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[styles.button, disabled && styles.buttonDisabled]}
        >
          <Text style={[styles.buttonText, textStyle]}>{title}</Text>
        </LinearGradient>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={activeOpacity}
      disabled={disabled}
      style={style}
    >
      <Text style={[styles.signUpText, textStyle, disabled && styles.textDisabled]}>
        {title}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  buttonContainer: {
    width: '100%',
    maxWidth: 400,
    marginBottom: 32,
  },
  button: {
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  signUpText: {
    fontSize: 14,
    color: '#000',
    marginBottom: 16,
  },
  textDisabled: {
    opacity: 0.5,
  },
});

