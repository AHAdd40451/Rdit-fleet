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
import { TextInput } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { loginStyles as styles } from './loginStyles';

const PRIMARY_COLOR = '#06402B';
const TEAL_GREEN = '#26A69A';
const BRIGHT_GREEN = '#66BB6A';

type LoginType = 'admin' | 'crew';

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginType, setLoginType] = useState<LoginType>('admin');

  const handleLogin = () => {
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
            <TextInput
              label="Email"
              value={email}
              onChangeText={setEmail}
              mode="outlined"
              style={styles.input}
              keyboardType="email-address"
              autoCapitalize="none"
              outlineColor="#E0E0E0"
              activeOutlineColor={PRIMARY_COLOR}
            />
            <View style={styles.passwordContainer}>
              <TextInput
                label="Password"
                value={password}
                onChangeText={setPassword}
                mode="outlined"
                style={[styles.input, styles.passwordInput]}
                secureTextEntry
                outlineColor="#E0E0E0"
                activeOutlineColor={PRIMARY_COLOR}
              />
              <TouchableOpacity
                style={styles.forgotPassword}
                onPress={() => Alert.alert('Forgot Password', 'Feature coming soon')}
              >
                <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Login Button with Gradient */}
          <TouchableOpacity
            style={styles.buttonContainer}
            onPress={handleLogin}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={[TEAL_GREEN, BRIGHT_GREEN]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.button}
            >
              <Text style={styles.buttonText}>Login</Text>
            </LinearGradient>
          </TouchableOpacity>

          {/* Sign Up Link */}
          <View style={styles.signUpContainer}>
            <TouchableOpacity
              onPress={() => Alert.alert('Sign Up', 'Feature coming soon')}
            >
              <Text style={styles.signUpText}>Sign Up</Text>
            </TouchableOpacity>
            <View style={styles.divider} />
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
