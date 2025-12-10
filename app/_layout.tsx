import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { PaperProvider } from 'react-native-paper';

export default function RootLayout() {
  return (
    <PaperProvider>
      <Stack>
        <Stack.Screen
          name="index"
          options={{
            title: 'Home',
          }}
        />
        <Stack.Screen
          name="(auth)/login"
          options={{
            title: 'Login',
          }}
        />
      </Stack>
      <StatusBar style="auto" />
    </PaperProvider>
  );
}

