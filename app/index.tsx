import { useState, useEffect, useRef } from 'react';
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
import PhoneInput, { ICountry, getCountryByCca2 } from 'react-native-international-phone-number';
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
  const [selectedCountry, setSelectedCountry] = useState<ICountry | undefined>(getCountryByCca2('US'));
  const [loginType, setLoginType] = useState<LoginType>('admin');
  const [loading, setLoading] = useState(false);
  const redirectingRef = useRef(false);

  // Redirect if already logged in (but not if we're currently logging in)
  useEffect(() => {
    const checkAndRedirect = async () => {
      // Don't redirect if we're in the middle of a login process
      if (loading || redirectingRef.current) return;
      
      if (session && userProfile && userProfile.role) {
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
  }, [session, userProfile, loading]);

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
        
        // Wait a moment for the profile to be fetched and context to update
        await new Promise(resolve => setTimeout(resolve, 800));
        
        // Get the updated profile directly from database to ensure we have the latest data
        const { data: profileData, error: profileError } = await supabase
          .from('users')
          .select('role')
          .eq('email', email.trim())
          .single();

        if (profileError) {
          console.error('Error fetching profile:', profileError);
          showToast('Login successful, but could not load profile. Please try again.', 'error');
          setLoading(false);
          return;
        }

        if (!profileData) {
          console.error('No profile data found');
          showToast('Login successful, but profile not found. Please contact support.', 'error');
          setLoading(false);
          return;
        }

        showToast('Login successful!', 'success', 1000);
        
        // Navigate to appropriate dashboard based on role
        // Prevent multiple redirects
        if (redirectingRef.current) {
          setLoading(false);
          return;
        }
        redirectingRef.current = true;
        
        // Redirect immediately after getting profile data
        try {
          let redirectPath = '/company'; // Default fallback
          
          if (profileData.role === 'admin') {
            // Check if company exists for admin
            const { data: companyData, error: companyError } = await supabase
              .from('company')
              .select('id')
              .eq('user_id', data.user.id)
              .single();

            // If company doesn't exist, redirect to company setup page
            if (companyError || !companyData) {
              redirectPath = '/company';
            } else {
              // Company exists, redirect to admin dashboard
              redirectPath = '/adminDashboard';
            }
          } else if (profileData.role === 'user') {
            redirectPath = '/userDashboard';
          }
          
          console.log('Redirecting to:', redirectPath);
          // Use replace to navigate
          router.replace(redirectPath);
        } catch (error) {
          console.error('Error during redirect:', error);
          // Fallback redirect to company page
          router.replace('/company');
        } finally {
          // Don't reset redirectingRef immediately - let the navigation complete
          setTimeout(() => {
            redirectingRef.current = false;
          }, 1000);
          setLoading(false);
        }
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
        redirectingRef.current = false;
      } finally {
        setLoading(false);
      }
    } else {
      if (!phoneNumber) {
        showToast('Please enter your phone number', 'error');
        return;
      }

      // Basic phone number validation (should have at least 7 digits)
      const digitsOnly = phoneNumber.replace(/\D/g, '');
      if (digitsOnly.length < 7 || !phoneNumber) {
        showToast('Please enter a valid phone number', 'error');
        return;
      }

      // Format phone number with country code
      // Access calling code from selectedCountry object
      let callingCode = '1'; // Default to USA
      
      if (selectedCountry) {

        
        // Try different possible property names for calling code
        const possibleProperties = [
          'callingCode',
          'calling_code', 
          'dialCode',
          'phoneCode',
          'countryCode',
          'phone_code'
        ];
        
        for (const prop of possibleProperties) {
          if ((selectedCountry as any)[prop]) {
            callingCode = String((selectedCountry as any)[prop]).replace('+', '');
            console.log(`Found calling code via ${prop}:`, callingCode);
            break;
          }
        }
        
        // If still not found, try to get it from the country's cca2 code
        if (callingCode === '1' && (selectedCountry as any).cca2) {
          // Expanded lookup table for calling codes by cca2
          const countryCallingCodes: { [key: string]: string } = {
            'AE': '971', 'SA': '966', 'QA': '974', 'KW': '965', 'BH': '973',
            'OM': '968', 'LB': '961', 'JO': '962', 'PK': '92', 'IN': '91',
            'CN': '86', 'JP': '81', 'DE': '49', 'GB': '44', 'IT': '39',
            'ES': '34', 'FR': '33', 'AU': '61', 'BR': '55', 'ZA': '27',
            'EG': '20', 'RU': '7', 'US': '1', 'CA': '1', 'MX': '52',
            'AR': '54', 'CL': '56', 'CO': '57', 'PE': '51', 'VE': '58',
            'NZ': '64', 'SG': '65', 'MY': '60', 'TH': '66', 'ID': '62',
            'PH': '63', 'VN': '84', 'KR': '82', 'TW': '886', 'HK': '852',
            'TR': '90', 'IL': '972', 'NG': '234', 'KE': '254'
          };
          const cca2 = (selectedCountry as any).cca2;
          if (countryCallingCodes[cca2]) {
            callingCode = countryCallingCodes[cca2];
            console.log(`Found calling code via cca2 lookup (${cca2}):`, callingCode);
          } else {
            console.warn(`Country code not found in lookup table for cca2: ${cca2}`);
          }
        }
      } else {
        console.warn('selectedCountry is undefined');
      }
      
      const formattedValue = `+${callingCode}${digitsOnly}`;
      console.log('Formatted phone number:', formattedValue);

      setLoading(true);

      try {
        // Use formatted phone number with country code
        const phoneToSearch = formattedValue;
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('*')
          .eq('phone_no', phoneToSearch)
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
          .eq('phone_no', phoneToSearch);

        if (updateError) {
          console.error('Error saving OTP:', updateError);
          throw new Error('Failed to send verification code. Please try again.');
        }
        
        // Send OTP via SMS using Supabase Edge Function
        try {
          const { data: functionData, error: functionError } = await supabase.functions.invoke('send-sms-otp', {
            body: { phone: phoneToSearch },
          });

          if (functionError) {
            console.error('Error sending SMS - function error:', {
              message: functionError.message,
              context: functionError.context,
              status: functionError.status,
            });
            // Don't throw - OTP is already saved, user can still verify
          } else if (functionData && !functionData.success) {
            console.error('Error sending SMS - function returned failure:', functionData);
            // Don't throw - OTP is already saved, user can still verify
          } else {
            console.log('SMS sent successfully');
          }
        } catch (smsError: any) {
          console.error('Error sending SMS - exception:', {
            message: smsError?.message,
            name: smsError?.name,
            stack: smsError?.stack,
          });
          // Don't throw error here - OTP is already saved, user can still verify
          // Just log the error for debugging
        }
        
        showToast('Verification code has been sent to your phone number', 'success');
        
        // Navigate to OTP verification screen
        setTimeout(() => {
          router.push({
            pathname: '/verifyOtp',
            params: { phoneNumber: phoneToSearch },
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
                  onForgotPasswordPress={() => router.push('/forgot-password')}
                />
              </>
            ) : (
              <View style={styles.phoneInputContainer}>
                <PhoneInput
                  value={phoneNumber}
                  onChangePhoneNumber={setPhoneNumber}
                  selectedCountry={selectedCountry}
                  onChangeSelectedCountry={setSelectedCountry}
                  phoneInputStyles={{
                    container: {
                      minHeight: 48,
                      backgroundColor: '#fff',
                      borderWidth: 1,
                      borderColor: '#E0E0E0',
                      borderRadius: 8,
                      paddingTop: 14,
                      paddingRight: 12,
                      paddingBottom: 14,
                      paddingLeft: 12,
                    },
                    flagContainer: {
                      backgroundColor: 'transparent',
                      paddingRight: 8,
                    },
                    flag: {
                      fontSize: 20,
                    },
                    caret: {
                      color: '#000',
                      fontSize: 16,
                    },
                    divider: {
                      backgroundColor: '#E0E0E0',
                      width: 1,
                      marginHorizontal: 8,
                    },
                    callingCode: {
                      fontSize: 16,
                      color: '#000',
                      fontWeight: '400',
                    },
                    input: {
                      fontSize: 16,
                      color: '#000',
                      flex: 1,
                    },
                  }}
                  placeholder="Phone Number"
                />
              </View>
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
