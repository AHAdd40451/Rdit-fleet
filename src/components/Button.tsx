import React from 'react';
import { Text, TouchableOpacity, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const TEAL_GREEN = '#14AB98';
const BRIGHT_GREEN = '#B0E56D';

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
    borderRadius: 10,
    alignItems: 'center',
  
    // Shadow for iOS
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  
    // Shadow for Android
    elevation: 4,
    // borderColor: '#000000',
    // borderBottomWidth: 1.4,
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

