import { useState } from 'react';
import {
  StyleSheet,
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

const PRIMARY_COLOR = '#06402B';
const LIGHT_GREEN = '#4CAF50';
const DARK_GREEN = '#2E7D32';
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
            <View style={styles.logoTextContainer}>
              <Text style={styles.logoTextRedi}>Redi</Text>
              <Text style={styles.logoTextFleet}>Fleet</Text>
            </View>
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    padding: 20,
    paddingTop: 60,
    alignItems: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  logoImage: {
    width: 80,
    height: 80,
    marginBottom: 12,
  },
  logoTextContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoTextRedi: {
    fontSize: 28,
    fontWeight: 'bold',
    color: LIGHT_GREEN,
  },
  logoTextFleet: {
    fontSize: 28,
    fontWeight: 'bold',
    color: DARK_GREEN,
  },
  description: {
    fontSize: 16,
    color: '#000',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  segmentedControl: {
    flexDirection: 'row',
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    padding: 4,
    marginBottom: 24,
    width: '100%',
    maxWidth: 400,
  },
  segment: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 6,
    alignItems: 'center',
  },
  segmentActive: {
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  segmentText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  segmentTextActive: {
    color: '#000',
    fontWeight: '600',
  },
  inputContainer: {
    width: '100%',
    maxWidth: 400,
    marginBottom: 24,
  },
  input: {
    marginBottom: 16,
    backgroundColor: '#fff',
  },
  passwordContainer: {
    marginBottom: 0,
  },
  passwordInput: {
    marginBottom: 0,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginTop: 4,
    marginBottom: 16,
  },
  forgotPasswordText: {
    fontSize: 12,
    color: '#666',
  },
  buttonContainer: {
    width: '100%',
    maxWidth: 400,
    marginBottom: 32,
  },
  button: {
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  signUpContainer: {
    alignItems: 'center',
    width: '100%',
  },
  signUpText: {
    fontSize: 14,
    color: '#000',
    marginBottom: 16,
  },
  divider: {
    width: '100%',
    height: 1,
    backgroundColor: '#E0E0E0',
    maxWidth: 400,
  },
});
