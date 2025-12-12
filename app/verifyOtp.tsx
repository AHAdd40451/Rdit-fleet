import { useState } from 'react';
import {
  Text,
  View,
  KeyboardAvoidingView,
  Platform,
  Image,
  ScrollView,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { loginStyles as styles } from './loginStyles';
import { Button } from '../src/components/Button';
import { Input } from '../src/components/Input';
import { LoadingBar } from '../src/components/LoadingBar';
import { useToast } from '../src/components/Toast';
import { supabase } from '../lib/supabase';
import { useAuth } from '../src/contexts/AuthContext';

export default function VerifyOtpScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ phoneNumber: string }>();
  const { showToast } = useToast();
  const { refreshUserProfile } = useAuth();
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);

  const handleVerifyOtp = async () => {
    if (!otp || otp.length !== 6) {
      showToast('Please enter a valid 6-digit OTP code', 'error');
      return;
    }

    setLoading(true);

    try {
      const phoneNumber = params.phoneNumber;

      // Check if user exists in database
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('phone_number', phoneNumber)
        .single();

      if (userError || !userData) {
        throw new Error('User not found. Please contact admin.');
      }

      // TODO: Implement actual OTP verification with Supabase Phone Auth
      // In production, use: 
      // const { data, error } = await supabase.auth.verifyOtp({ 
      //   phone: phoneNumber, 
      //   token: otp 
      // });
      // This will automatically create a session

      // For now, simulate OTP verification (remove this in production)
      // Default OTP for testing: 123456
      if (otp !== '123456') {
        throw new Error('Invalid OTP code. Please try again.');
      }

      // Since we're not using Supabase Phone Auth yet, we need to create a session manually
      // For production, the verifyOtp above will handle this automatically
      // Workaround: Create a passwordless session or use email-based auth
      // For now, we'll store user info and navigate - the userDashboard will work
      // but won't have a full Supabase Auth session until Phone Auth is configured

      showToast('OTP verified successfully!', 'success', 2000);

      // Wait a moment for toast to show
      await new Promise(resolve => setTimeout(resolve, 500));

      // Navigate to user dashboard
      // Note: In production with Supabase Phone Auth configured, 
      // the session will be created automatically and refreshUserProfile will work
      router.replace('/userDashboard');
    } catch (error: any) {
      console.error('OTP verification error:', error);
      showToast(
        error.message || 'Failed to verify OTP. Please try again.',
        'error'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setLoading(true);
    try {
      const phoneNumber = params.phoneNumber;
      
      // Check if user exists
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('phone_number', phoneNumber)
        .single();

      if (userError || !userData) {
        throw new Error('User not found. Please contact admin.');
      }

      // TODO: Implement actual OTP resend with Supabase Phone Auth
      // await supabase.auth.signInWithOtp({ phone: phoneNumber });
      
      // Simulate resend
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      showToast('OTP code has been resent to your phone number', 'success');
    } catch (error: any) {
      console.error('Resend OTP error:', error);
      showToast(
        error.message || 'Failed to resend OTP. Please try again.',
        'error'
      );
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

          {/* Description Text */}
          <Text style={styles.description}>
            Enter the verification code{'\n'}
            sent to {params.phoneNumber}
          </Text>

          {/* OTP Input Field */}
          <View style={styles.inputContainer}>
            <Input
              variant="text"
              label="Verification Code"
              value={otp}
              onChangeText={(text) => setOtp(text.replace(/[^0-9]/g, '').slice(0, 6))}
              style={styles.input}
              keyboardType="number-pad"
              maxLength={6}
              placeholder="Enter 6-digit code"
            />
          </View>

          {/* Verify Button */}
          <Button
            variant="gradient"
            title={loading ? 'Verifying...' : 'Verify OTP'}
            onPress={handleVerifyOtp}
            disabled={loading}
          />
          {loading && (
            <View style={{ marginTop: 16, width: '100%', maxWidth: 400 }}>
              <LoadingBar variant="bar" />
            </View>
          )}

          {/* Resend OTP Link */}
          <View style={styles.signUpContainer}>
            <Text style={styles.signUpText}>Didn't receive the code? </Text>
            <Button
              variant="default"
              title="Resend OTP"
              onPress={handleResendOtp}
              disabled={loading}
            />
          </View>

          <View style={styles.divider} />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

