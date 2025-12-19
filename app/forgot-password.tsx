import { useState } from 'react';
import {
  Text,
  View,
  KeyboardAvoidingView,
  Platform,
  Image,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import Constants from 'expo-constants';
import { loginStyles as styles } from './loginStyles';
import { Button } from '../src/components/Button';
import { Input } from '../src/components/Input';
import { LoadingBar } from '../src/components/LoadingBar';
import { useToast } from '../src/components/Toast';
import { supabase } from '../lib/supabase';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const { showToast } = useToast();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleResetPassword = async () => {
    if (!email) {
      showToast('Please enter your email address', 'error');
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      showToast('Please enter a valid email address', 'error');
      return;
    }

    setLoading(true);

    try {
      // Use the custom scheme that matches Supabase configuration
      // This must match the redirect URL configured in Supabase dashboard
      // Note: This requires a development build or production build (not Expo Go)
      // For Expo Go testing, you would need to add exp:// URLs to Supabase redirect URLs
      const redirectUrl = 'redit-fleet://reset-password';

      // Send password reset email
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: redirectUrl,
      });

      if (error) {
        throw error;
      }

      showToast('Password reset email sent! Please check your inbox.', 'success', 3000);
      
      // Navigate back to login after a delay
      setTimeout(() => {
        router.back();
      }, 2000);
    } catch (error: any) {
      console.error('Password reset error:', error);
      
      let errorMessage = 'Failed to send password reset email. Please try again.';
      if (error.message) {
        if (error.message.includes('rate limit')) {
          errorMessage = 'Too many requests. Please try again later.';
        } else {
          errorMessage = error.message;
        }
      }
      
      showToast(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          {/* Logo Section */}
          <View style={styles.logoContainer}>
            <Image
              source={require('../assets/logo.png')}
              style={styles.logoImage}
              resizeMode="contain"
            />
          </View>

          {/* Title */}
          <Text style={[styles.description, { marginBottom: 8, fontSize: 24, fontWeight: '600' }]}>
            Forgot Password?
          </Text>

          {/* Description Text */}
          <Text style={[styles.description, { marginBottom: 32, fontSize: 14, color: '#666' }]}>
            Enter your email address and we'll send you a link to reset your password.
          </Text>

          {/* Input Field */}
          <View style={styles.inputContainer}>
            <Input
              variant="text"
              label="Email"
              value={email}
              onChangeText={setEmail}
              style={styles.input}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
            />
          </View>

          {/* Send Reset Link Button */}
          <Button
            variant="gradient"
            title={loading ? 'Sending...' : 'Send Reset Link'}
            onPress={handleResetPassword}
            disabled={loading}
          />
          {loading && (
            <View style={{ marginTop: 16, width: '100%', maxWidth: 400 }}>
              <LoadingBar variant="bar" />
            </View>
          )}

          {/* Back to Login Link */}
          <View style={styles.signUpContainer}>
            <Text style={styles.signUpText}>Remember your password? </Text>
            <Button
              variant="default"
              title="Back to Login"
              onPress={() => router.back()}
            />
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

