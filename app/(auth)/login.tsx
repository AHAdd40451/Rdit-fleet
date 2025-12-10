import { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { TextInput } from 'react-native-paper';


const PRIMARY_COLOR = '#06402B';

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    // TODO: Implement actual authentication logic
    console.log('Login attempt:', { email, password });
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
    >
      <View >
      <TextInput
      label="Email"
      value={email}
      onChangeText={email => setEmail(email)}
    />
      </View>
    </KeyboardAvoidingView>
  );
}


