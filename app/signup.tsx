import { useState, useEffect } from 'react';
import {
  Text,
  View,
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

export default function SignupScreen() {
  const router = useRouter();
  const { showToast } = useToast();
  const { session, userProfile, refreshUserProfile } = useAuth();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // Redirect if already logged in
  useEffect(() => {
    const checkAndRedirect = async () => {
      if (session && userProfile) {
        if (userProfile.role === 'admin') {
          // Check if company exists for admin before redirecting
          try {
            const { data: companyData, error: companyError } = await supabase
              .from('company')
              .select('id')
              .eq('user_id', session.user.id)
              .single();

            // If company doesn't exist, redirect to company setup page
            if (companyError || !companyData) {
              router.replace('/company');
            } else {
              // Company exists, redirect to admin dashboard
              router.replace('/adminDashboard');
            }
          } catch (error) {
            console.error('Error checking company:', error);
            // On error, redirect to company page to be safe
            router.replace('/company');
          }
        } else if (userProfile.role === 'user') {
          router.replace('/userDashboard');
        }
      }
    };

    checkAndRedirect();
  }, [session, userProfile]);

  const handleSignup = async () => {
    if (!firstName || !lastName || !email || !password) {
      showToast('Please fill in all fields', 'error');
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      showToast('Please enter a valid email address', 'error');
      return;
    }

    // Validate password length
    if (password.length < 6) {
      showToast('Password must be at least 6 characters long', 'error');
      return;
    }

    setLoading(true);

    try {
      // Sign up the user with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: email.trim(),
        password: password,
      });

      if (authError) {
        throw authError;
      }

      if (!authData.user) {
        throw new Error('Failed to create user account');
      }
      const userData: any = {
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        email: email.trim(),
        password: password,
        role: 'admin', 
      };
      const { error: dbError } = await supabase
        .from('users')
        .insert([userData]);

      if (dbError) {
        console.error('Database error:', dbError);
        // Provide more detailed error message
        const errorMessage = dbError.message || 'Failed to create user profile.';
        throw new Error(
          `Database error: ${errorMessage}. Please check your table structure.`
        );
      }

      // Wait a moment for the profile to be committed to the database
      await new Promise(resolve => setTimeout(resolve, 500));

      // Refresh user profile to get the updated role
      await refreshUserProfile();

      // Wait a bit more to ensure profile is loaded
      await new Promise(resolve => setTimeout(resolve, 500));

      showToast('Account created successfully!', 'success', 2000);
      
      setTimeout(async () => {
        // Get the created user profile to check role
        const { data: profileData, error: profileError } = await supabase
          .from('users')
          .select('role')
          .eq('email', email.trim())
          .single();

        if (profileError) {
          console.error('Error fetching profile after signup:', profileError);
          // If profile fetch fails, still redirect to company page for admin
          router.replace('/company');
          return;
        }

        if (profileData?.role === 'admin') {
          // Admin should go to company setup page (company doesn't exist yet for new admin)
          router.replace('/company');
        } else {
          // Regular users go to login
          router.replace('/');
        }
      }, 2000);
    } catch (error: any) {
      console.error('Signup error:', error);
      showToast(
        error.message || 'An error occurred during signup. Please try again.',
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
            Create your account to get started.{'\n'}
            Join Redi Fleet today.
          </Text>

          {/* Input Fields */}
          <View style={styles.inputContainer}>
            <Input
              variant="text"
              label="First Name"
              value={firstName}
              onChangeText={setFirstName}
              style={styles.input}
              autoCapitalize="words"
            />
            <Input
              variant="text"
              label="Last Name"
              value={lastName}
              onChangeText={setLastName}
              style={styles.input}
              autoCapitalize="words"
            />
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
            />
          </View>

          {/* Sign Up Button with Gradient */}
          <Button
            variant="gradient"
            title={loading ? 'Creating Account...' : 'Create Account'}
            onPress={handleSignup}
            disabled={loading}
          />
          {loading && (
            <View style={{ marginTop: 16, width: '100%', maxWidth: 400 }}>
              <LoadingBar variant="bar" />
            </View>
          )}

          {/* Login Link */}
          <View style={styles.signUpContainer}>
            <Text style={styles.signUpText}>Already have an account? </Text>
            <Button
              variant="default"
              title="Login"
              onPress={() => router.push('/')}
            />
          </View>

          <View style={styles.divider} />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

