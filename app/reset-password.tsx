import { useState, useEffect } from 'react';
import {
  Text,
  View,
  KeyboardAvoidingView,
  Platform,
  Image,
  ScrollView,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as Linking from 'expo-linking';
import { loginStyles as styles } from './loginStyles';
import { Button } from '../src/components/Button';
import { Input } from '../src/components/Input';
import { LoadingBar } from '../src/components/LoadingBar';
import { useToast } from '../src/components/Toast';
import { supabase } from '../lib/supabase';

export default function ResetPasswordScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { showToast } = useToast();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isValidating, setIsValidating] = useState(true);

  useEffect(() => {
    // Handle deep link URL parameters from Supabase password reset
    let subscription: { remove: () => void } | null = null;

    const handleDeepLink = async () => {
      try {
        // Get the initial URL if app was opened via deep link
        const url = await Linking.getInitialURL();
        
        // Also listen for URL changes (in case app was already open)
        const handleUrlChange = (event: { url: string }) => {
          if (event.url.includes('reset-password')) {
            // URL contains reset-password, which is good
            setIsValidating(false);
          }
        };

        subscription = Linking.addEventListener('url', handleUrlChange);
        
        // Check if we have URL parameters from the route or deep link
        const hasParams = params.access_token || params.type || params.hash || 
                        (url && (url.includes('reset-password') || url.includes('access_token') || url.includes('type=recovery')));
        
        if (!hasParams) {
          // Wait a bit for URL to be processed
          setTimeout(async () => {
            const finalUrl = await Linking.getInitialURL();
            if (!finalUrl || (!finalUrl.includes('reset-password') && !finalUrl.includes('access_token'))) {
              showToast('Invalid reset link. Please request a new one.', 'error');
              setTimeout(() => {
                router.replace('/');
              }, 2000);
            }
            setIsValidating(false);
          }, 1000);
          return;
        }

        // For password reset, Supabase processes the token from the URL automatically
        // when updateUser is called. We don't need to check for a session beforehand.
        // The token validation happens when we try to update the password.
        setIsValidating(false);
      } catch (error) {
        console.error('Error validating reset link:', error);
        showToast('Error validating reset link. Please try again.', 'error');
        setIsValidating(false);
      }
    };

    handleDeepLink();

    // Cleanup function
    return () => {
      if (subscription) {
        subscription.remove();
      }
    };
  }, [params, router]);

  const handleResetPassword = async () => {
    if (!password || !confirmPassword) {
      showToast('Please fill in all fields', 'error');
      return;
    }

    if (password.length < 6) {
      showToast('Password must be at least 6 characters long', 'error');
      return;
    }

    if (password !== confirmPassword) {
      showToast('Passwords do not match', 'error');
      return;
    }

    setLoading(true);

    try {
      // Check if we have a valid reset token in the URL
      // Supabase's updateUser will automatically use the token from the URL hash
      // even with detectSessionInUrl: false for password reset flows
      const url = await Linking.getInitialURL();
      const hasResetToken = url?.includes('reset-password') && (url.includes('#') || url.includes('access_token') || url.includes('type=recovery'));
      
      if (!hasResetToken) {
        // Try to get session to see if token was already processed
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          throw new Error('No valid reset token found. Please request a new password reset link.');
        }
      }

      // Update the password - Supabase will use the reset token from the URL
      const { error } = await supabase.auth.updateUser({
        password: password,
      });

      if (error) {
        throw error;
      }

      showToast('Password reset successfully!', 'success', 2000);

      // Navigate to login after a delay
      setTimeout(() => {
        router.replace('/');
      }, 2000);
    } catch (error: any) {
      console.error('Password reset error:', error);
      
      let errorMessage = 'Failed to reset password. Please try again.';
      if (error.message) {
        if (error.message.includes('session')) {
          errorMessage = 'Your reset link has expired. Please request a new one.';
        } else {
          errorMessage = error.message;
        }
      }
      
      showToast(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Show loading state while validating the reset link
  if (isValidating) {
    return (
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={true}
          scrollEnabled={true}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          nestedScrollEnabled={true}
          bounces={false}
        >
          <View style={styles.content}>
            <View style={styles.logoContainer}>
              <Image
                source={require('../assets/logo.png')}
                style={styles.logoImage}
                resizeMode="contain"
              />
            </View>
            <Text style={[styles.description, { marginBottom: 32 }]}>
              Validating reset link...
            </Text>
            <LoadingBar variant="spinner" />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

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
            Reset Password
          </Text>

          {/* Description Text */}
          <Text style={[styles.description, { marginBottom: 32, fontSize: 14, color: '#666' }]}>
            Enter your new password below.
          </Text>

          {/* Input Fields */}
          <View style={styles.inputContainer}>
            <Input
              variant="text"
              label="New Password"
              value={password}
              onChangeText={setPassword}
              style={styles.input}
              secureTextEntry
              autoCapitalize="none"
              autoComplete="password-new"
            />
            <Input
              variant="text"
              label="Confirm Password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              style={styles.input}
              secureTextEntry
              autoCapitalize="none"
              autoComplete="password-new"
            />
          </View>

          {/* Reset Password Button */}
          <Button
            variant="gradient"
            title={loading ? 'Resetting...' : 'Reset Password'}
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
              onPress={() => router.replace('/')}
            />
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

