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
  const { session, userProfile } = useAuth();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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

      // Insert user data into users table with role='user' (default role for new signups)
      // The 'id' field is auto-incrementing integer, so we don't include it
      // Note: Password is stored in Supabase Auth, but if your table requires it, we include it here
      // Ideally, the password field should be removed from the users table since auth handles passwords
      const userData: any = {
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        email: email.trim(),
        password: password, // Required by table, but password is primarily managed by Supabase Auth
        role: 'user', // Default role for new signups
      };

      // Only include auth_user_id if the column exists in your table
      // Uncomment the line below if your table has an auth_user_id column (UUID type)
      // userData.auth_user_id = authData.user.id;

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

      showToast('Account created successfully!', 'success', 2000);
      // Navigate after a short delay to show the success toast
      setTimeout(() => {
        router.push('/');
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

