import { useState, useEffect } from 'react';
import {
  Text,
  View,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Image,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { loginStyles as styles } from './loginStyles';
import { Button } from '../src/components/Button';
import { Input } from '../src/components/Input';
import { LoadingBar } from '../src/components/LoadingBar';
import { useToast } from '../src/components/Toast';
import { supabase } from '../lib/supabase';
import { useAuth } from '../src/contexts/AuthContext';

type LoginType = 'admin' | 'crew';

export default function LoginScreen() {
  const router = useRouter();
  const { showToast } = useToast();
  const { session, userProfile, refreshUserProfile } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loginType, setLoginType] = useState<LoginType>('admin');
  const [loading, setLoading] = useState(false);

  // Redirect if already logged in
  useEffect(() => {
    if (session && userProfile) {
      if (userProfile.role === 'admin') {
        router.replace('/adminDashboard');
      } else if (userProfile.role === 'user') {
        router.replace('/userDashboard');
      }
    }
  }, [session, userProfile]);

  const handleLogin = async () => {
    if (loginType === 'admin') {
      if (!email || !password) {
        showToast('Please fill in all fields', 'error');
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
        // Sign in with Supabase Auth
        const { data, error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password: password,
        });

        if (error) {
          throw error;
        }

        if (!data.user) {
          throw new Error('Failed to sign in. Please try again.');
        }

        // Fetch user profile to get role
        await refreshUserProfile();
        
        // Wait a moment for the profile to be fetched
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Get the updated profile from auth context
        const { data: profileData } = await supabase
          .from('users')
          .select('role')
          .eq('email', email.trim())
          .single();

        showToast('Login successful!', 'success', 2000);
        
        // Navigate to appropriate dashboard based on role
        setTimeout(async () => {
          if (profileData?.role === 'admin') {
            // Check if company exists for admin
            const { data: companyData, error: companyError } = await supabase
              .from('company')
              .select('id')
              .eq('user_id', data.user.id)
              .single();

            // If company doesn't exist, redirect to company setup page
            if (companyError || !companyData) {
              router.replace('/company');
            } else {
              // Company exists, redirect to admin dashboard
              router.replace('/adminDashboard');
            }
          } else if (profileData?.role === 'user') {
            router.replace('/userDashboard');
          } else {
            // Default to admin dashboard if role is not found
            router.replace('/adminDashboard');
          }
        }, 2000);
      } catch (error: any) {
        console.error('Login error:', error);
        
        // Provide user-friendly error messages
        let errorMessage = 'An error occurred during login. Please try again.';
        
        if (error.message) {
          if (error.message.includes('Invalid login credentials')) {
            errorMessage = 'Invalid email or password. Please check your credentials.';
          } else if (error.message.includes('Email not confirmed')) {
            errorMessage = 'Please verify your email before logging in.';
          } else {
            errorMessage = error.message;
          }
        }
        
        showToast(errorMessage, 'error');
      } finally {
        setLoading(false);
      }
    } else {
      if (!phoneNumber) {
        showToast('Please enter your phone number', 'error');
        return;
      }

      // Validate phone number format (basic validation)
      const phoneRegex = /^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/;
      if (!phoneRegex.test(phoneNumber.replace(/\s/g, ''))) {
        showToast('Please enter a valid phone number', 'error');
        return;
      }

      setLoading(true);

      try {
        // Check if user exists in database
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('*')
          .eq('phone_no', phoneNumber.trim())
          .single();

        if (userError || !userData) {
          throw new Error('Phone number not found. Please contact admin.');
        }

        // Generate 6-digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        
        // Save OTP to users table (no expiration)
        const { error: updateError } = await supabase
          .from('users')
          .update({ otp: otp })
          .eq('phone_no', phoneNumber.trim());

        if (updateError) {
          console.error('Error saving OTP:', updateError);
          throw new Error('Failed to send verification code. Please try again.');
        }
        
        // TODO: In production, send OTP via SMS service (Twilio, AWS SNS, etc.)
        // For now, log it for testing purposes
        console.log('OTP sent to', phoneNumber, ':', otp);
        
        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        showToast('Verification code has been sent to your phone number', 'success');
        
        // Navigate to OTP verification screen
        setTimeout(() => {
          router.push({
            pathname: '/verifyOtp',
            params: { phoneNumber: phoneNumber.trim() },
          });
        }, 1500);
      } catch (error: any) {
        console.error('OTP sending error:', error);
        showToast(
          error.message || 'Failed to send verification code. Please try again.',
          'error'
        );
      } finally {
        setLoading(false);
      }
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
            {/* <View style={styles.logoTextContainer}>
              <Text style={styles.logoTextRedi}>Redi</Text>
              <Text style={styles.logoTextFleet}>Fleet</Text>
            </View> */}
          </View>

          {/* Description Text */}
          <Text style={styles.description}>
            Smart Reminders.{'\n'}
            Predictive Maintenance.{'\n'}
            Hassle-Free Fleet Management.
          </Text>

          {/* Login Type Segmented Control */}
          <View style={styles.segmentedControl}>
            <TouchableOpacity
              style={[
                styles.segment,
                loginType === 'admin' && styles.segmentActive,
              ]}
              onPress={() => setLoginType('admin')}
            >
              <Text
                style={[
                  styles.segmentText,
                  loginType === 'admin' && styles.segmentTextActive,
                ]}
              >
                Admin Login
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.segment,
                loginType === 'crew' && styles.segmentActive,
              ]}
              onPress={() => setLoginType('crew')}
            >
              <Text
                style={[
                  styles.segmentText,
                  loginType === 'crew' && styles.segmentTextActive,
                ]}
              >
                Crew Login
              </Text>
            </TouchableOpacity>
          </View>

          {/* Input Fields */}
          <View style={styles.inputContainer}>
            {loginType === 'admin' ? (
              <>
                <Input
                  variant="text"
                  label="Email"
                  value={email}
                  onChangeText={setEmail}
                  style={styles.input}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
                <Input
                  variant="text"
                  label="Password"
                  value={password}
                  onChangeText={setPassword}
                  style={styles.input}
                  secureTextEntry
                  showForgotPassword
                  onForgotPasswordPress={() => showToast('Forgot Password feature coming soon', 'info')}
                />
              </>
            ) : (
              <Input
                variant="text"
                label="Phone Number"
                placeholder="Phone Number"
                value={phoneNumber}
                onChangeText={setPhoneNumber}
                style={styles.input}
                keyboardType="phone-pad"
              />
            )}
          </View>

          {/* Login/Send Code Button with Gradient */}
          <Button
            variant="gradient"
            title={
              loading
                ? loginType === 'admin'
                  ? 'Logging in...'
                  : 'Sending Code...'
                : loginType === 'admin'
                ? 'Login'
                : 'Send Code'
            }
            onPress={handleLogin}
            disabled={loading}
          />
          {loading && (
            <View style={{ marginTop: 16, width: '100%', maxWidth: 400 }}>
              <LoadingBar variant="bar" />
            </View>
          )}

          {/* Sign Up Link - Only show for admin */}
          {loginType === 'admin' && (
            <View style={styles.signUpContainer}>
              <Text style={styles.signUpText}>Don't have an account? </Text>
              <Button
                variant="default"
                title="Sign Up"
                onPress={() => router.push('/signup')}
              />
             
            </View>
          )}
           <View style={styles.divider} />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
