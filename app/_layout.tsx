import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { PaperProvider } from 'react-native-paper';
import { ToastProvider } from '../src/components/Toast';
import { AuthProvider, useAuth } from '../src/contexts/AuthContext';
import { useEffect } from 'react';

function RootLayoutNav() {
  const { session, userProfile, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    const currentRoute = segments[0];
    const isAuthRoute = currentRoute === 'index' || currentRoute === 'signup' || currentRoute === 'verifyOtp' || currentRoute === '(auth)';
    const isDashboardRoute = currentRoute === 'adminDashboard' || currentRoute === 'userDashboard' || currentRoute === 'home';

    // Check if user is authenticated (either via Supabase session or phone-based auth)
    const isAuthenticated = session || userProfile;

    if (!isAuthenticated) {
      // User is not signed in
      if (isDashboardRoute) {
        // Trying to access protected route, redirect to login
        router.replace('/');
      }
      // If on auth route (including verifyOtp), stay there
    } else {
      // User is signed in (via email or phone)
      if (isAuthRoute) {
        // User is signed in and trying to access auth routes (login/signup)
        // Redirect to appropriate dashboard based on role
        if (userProfile?.role === 'admin') {
          router.replace('/adminDashboard');
        } else if (userProfile?.role === 'user') {
          router.replace('/userDashboard');
        }
        // If role is not yet loaded, the effect will run again when it loads
      } else if (isDashboardRoute && userProfile) {
        // User is signed in and accessing dashboard routes
        // Ensure they're on the right dashboard based on role
        if (userProfile.role === 'admin' && currentRoute !== 'adminDashboard' && currentRoute !== 'home') {
          router.replace('/adminDashboard');
        } else if (userProfile.role === 'user' && currentRoute !== 'userDashboard' && currentRoute !== 'home') {
          router.replace('/userDashboard');
        }
      }
    }
  }, [session, userProfile, segments, loading]);

  return (
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
        name="adminDashboard"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="userDashboard"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="verifyOtp"
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
  );
}

export default function RootLayout() {
  return (
    <PaperProvider>
      <ToastProvider>
        <AuthProvider>
          <RootLayoutNav />
          <StatusBar style="auto" />
        </AuthProvider>
      </ToastProvider>
    </PaperProvider>
  );
}

