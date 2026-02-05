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
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function VerifyOtpScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ phoneNumber: string }>();
  const { showToast } = useToast();
  const { refreshUserProfile } = useAuth();
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);

  const handleVerifyOtp = async () => {
    const isTestOtp = otp === '0000';
    if (!otp || (otp.length !== 6 && !isTestOtp)) {
      showToast('Please enter a valid 6-digit OTP code (or 0000 for testing)', 'error');
      return;
    }

    setLoading(true);

    try {
      const phoneNumber = params.phoneNumber;

      // Check if user exists in database and get OTP
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('phone_no', phoneNumber)
        .single();

      if (userError || !userData) {
        throw new Error('User not found. Please contact admin.');
      }

      // Testing: accept 0000 as valid OTP without checking DB
      if (!isTestOtp) {
        // Check if OTP exists
        if (!userData.otp) {
          throw new Error('No OTP found. Please request a new code.');
        }

        // Verify OTP (no expiration check)
        if (userData.otp !== otp) {
          throw new Error('Invalid OTP code. Please try again.');
        }
      }

      // OTP is valid - clear OTP from database
      const { error: clearOtpError } = await supabase
        .from('users')
        .update({ otp: null })
        .eq('phone_no', phoneNumber);

      if (clearOtpError) {
        console.error('Error clearing OTP:', clearOtpError);
        // Don't throw error here, OTP is already verified
      }

      // If user has an email, create a Supabase Auth account for them
      // This ensures they have an auth UUID available for asset creation
      if (userData.email) {
        try {
          // Generate a secure random password for the user
          // They can reset it later if needed, but phone login doesn't require it
          const tempPassword = `phone_${userData.id}_${Date.now()}_${Math.random().toString(36).slice(-12)}`;
          
          const { data: authData, error: authError } = await supabase.auth.signUp({
            email: userData.email.trim(),
            password: tempPassword,
            options: {
              emailRedirectTo: undefined, // No email confirmation needed for phone-based users
            }
          });

          if (authError) {
            // If user already exists in auth, that's okay - they can use it
            if (!authError.message.includes('already registered') && !authError.message.includes('already exists')) {
              console.error('Error creating Supabase Auth account:', authError);
              // Don't throw - phone login can still work without auth account
            } else {
              console.log('Supabase Auth account already exists for user:', userData.email);
            }
          } else if (authData.user) {
            // Successfully created auth account
            console.log('Supabase Auth account created for phone user:', userData.email);
            // Sign in with the new account to establish session
            await supabase.auth.signInWithPassword({
              email: userData.email.trim(),
              password: tempPassword,
            });
          }
        } catch (authErr) {
          console.error('Error creating Supabase Auth account:', authErr);
          // Don't throw - phone login can still work without auth account
        }
      }

      // Store user info in AsyncStorage for phone-based authentication
      // This allows AuthContext to recognize the user as authenticated
      const userProfileData = {
        id: userData.id,
        phone_no: userData.phone_no,
        email: userData.email || undefined,
        role: userData.role,
        first_name: userData.first_name,
        last_name: userData.last_name,
        userId: userData.userId || undefined, // Include userId field
      };
      
      await AsyncStorage.setItem('phone_user', JSON.stringify(userProfileData));

      // Refresh user profile in AuthContext
      await refreshUserProfile();

      showToast('OTP verified successfully!', 'success', 2000);

      // Wait a moment for toast to show
      await new Promise(resolve => setTimeout(resolve, 500));

      // Navigate to user dashboard
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
        .eq('phone_no', phoneNumber)
        .single();

      if (userError || !userData) {
        throw new Error('User not found. Please contact admin.');
      }

      // Generate new 6-digit OTP
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      
      // Save new OTP to users table (no expiration)
      const { error: updateError } = await supabase
        .from('users')
        .update({ otp: otp })
        .eq('phone_no', phoneNumber);
      
      console.log('Resent OTP for', phoneNumber, ':', otp);

      if (updateError) {
        console.error('Error saving OTP:', updateError);
        throw new Error('Failed to resend verification code. Please try again.');
      }

      // TODO: In production, send OTP via SMS service (Twilio, AWS SNS, etc.)
      // For now, log it for testing purposes
      console.log('Resent OTP for', phoneNumber, ':', otp);
      
      // Simulate API call delay
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
        showsVerticalScrollIndicator={true}
        scrollEnabled={true}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        nestedScrollEnabled={true}
        bounces={false}
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
              placeholder="6-digit code or 0000 for testing"
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

