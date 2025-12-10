import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  TextInput,
  TextInputProps,
  ViewStyle,
  TextStyle,
  TouchableOpacity,
  Text,
} from 'react-native';

const PRIMARY_COLOR = '#06402B';
const OUTLINE_COLOR = '#E0E0E0';
const SPACING_SCALE_03 = 8; // Spacing scale 03

export interface InputProps extends TextInputProps {
  variant?: 'simple' | 'text';
  className?: string;
  style?: ViewStyle | ViewStyle[];
  showForgotPassword?: boolean;
  onForgotPasswordPress?: () => void;
  label?: string;
}

export const Input: React.FC<InputProps> = ({
  variant = 'text',
  style,
  className,
  showForgotPassword = false,
  onForgotPasswordPress,
  label,
  placeholder,
  value,
  ...props
}) => {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View style={[styles.container, style]}>
      <View
        style={[
          styles.inputWrapper,
          isFocused && styles.inputWrapperFocused,
        ]}
      >
        <TextInput
          style={[
            styles.input,
            showForgotPassword && styles.inputWithForgotPassword,
          ]}
          placeholder={label || placeholder}
          placeholderTextColor="#999"
          value={value}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          {...props}
        />
        {showForgotPassword && (
          <TouchableOpacity
            style={styles.forgotPasswordButton}
            onPress={onForgotPasswordPress}
            activeOpacity={0.7}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 48,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: OUTLINE_COLOR,
    borderRadius: SPACING_SCALE_03,
    paddingTop: 14,
    paddingRight: 12,
    paddingBottom: 14,
    paddingLeft: 12,
  },
  inputWrapperFocused: {
    borderColor: PRIMARY_COLOR,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#000',
    padding: 0,
    margin: 0,
    minHeight: 20,
  },
  inputWithForgotPassword: {
    marginRight: 8,
    flexShrink: 1,
  },
  forgotPasswordButton: {
    justifyContent: 'center',
    alignItems: 'flex-end',
    paddingLeft: 8,
    flexShrink: 0,
  },
  forgotPasswordText: {
    fontSize: 14,
    color: '#000',
    fontWeight: '400',
  },
});

