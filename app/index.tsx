import { useState } from 'react';
import {
  Text,
  View,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Image,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { loginStyles as styles } from './loginStyles';
import { Button } from '../src/components/Button';
import { Input } from '../src/components/Input';

type LoginType = 'admin' | 'crew';

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loginType, setLoginType] = useState<LoginType>('admin');

  const handleLogin = () => {
    if (loginType === 'admin') {
      if (!email || !password) {
        Alert.alert('Error', 'Please fill in all fields');
        return;
      }
      // TODO: Implement actual authentication logic
      console.log('Login attempt:', { email, password, loginType });
      Alert.alert('Success', 'Login successful!', [
        {
          text: 'OK',
          onPress: () => router.push('/'),
        },
      ]);
    } else {
      if (!phoneNumber) {
        Alert.alert('Error', 'Please enter your phone number');
        return;
      }
      // TODO: Implement OTP sending logic
      console.log('Send code to:', { phoneNumber, loginType });
      Alert.alert('Code Sent', 'Verification code has been sent to your phone number');
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
                  onForgotPasswordPress={() => Alert.alert('Forgot Password', 'Feature coming soon')}
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
            title={loginType === 'admin' ? 'Login' : 'Send Code'}
            onPress={handleLogin}
          />

          {/* Sign Up Link - Only show for admin */}
          {loginType === 'admin' && (
            <View style={styles.signUpContainer}>
              <Button
                variant="default"
                title="Sign Up"
                onPress={() => Alert.alert('Sign Up', 'Feature coming soon')}
              />
             
            </View>
          )}
           <View style={styles.divider} />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
