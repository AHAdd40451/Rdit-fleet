import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { PaperProvider } from 'react-native-paper';
import { ToastProvider } from '../src/components/Toast';

export default function RootLayout() {
  return (
    <PaperProvider>
      <ToastProvider>
        <Stack>
        <Stack.Screen
          name="index"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="home"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="signup"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="(auth)/login"
          options={{
            headerShown: false,
          }}
        />
      </Stack>
      <StatusBar style="auto" />
      </ToastProvider>
    </PaperProvider>
  );
}

