import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { PaperProvider } from 'react-native-paper';
import { ToastProvider } from '../src/components/Toast';
import { AuthProvider, useAuth } from '../src/contexts/AuthContext';
import { ConfirmationModalProvider } from '../src/contexts/ConfirmationModalContext';
import { useEffect } from 'react';
import * as Linking from 'expo-linking';
import { LogBox } from 'react-native';

// Suppress VirtualizedList warning from react-native-phone-number-input
// This warning occurs because PhoneInput uses a VirtualizedList internally for country selection
LogBox.ignoreLogs([
  'VirtualizedLists should never be nested inside plain ScrollViews with the same orientation because it can break windowing and other functionality - use another VirtualizedList-backed container instead.',
  /VirtualizedLists should never be nested/,
]);

function RootLayoutNav() {
  const { session, userProfile, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  // Handle deep links for password reset
  useEffect(() => {
    const handleDeepLink = async (event: { url: string }) => {
      const { path, queryParams } = Linking.parse(event.url);
      
      // Handle password reset deep link
      if (path === 'reset-password' || event.url.includes('reset-password')) {
        // Navigate to reset-password screen with the URL parameters
        router.replace({
          pathname: '/reset-password',
          params: queryParams,
        });
      }
    };

    // Get initial URL if app was opened via deep link
    Linking.getInitialURL().then((url) => {
      if (url) {
        handleDeepLink({ url });
      }
    });

    // Listen for deep links while app is running
    const subscription = Linking.addEventListener('url', handleDeepLink);

    return () => {
      subscription.remove();
    };
  }, [router]);

  useEffect(() => {
    if (loading) return;

    const currentRoute = segments[0];
    const isAuthRoute = currentRoute === 'index' || currentRoute === 'signup' || currentRoute === 'verifyOtp' || currentRoute === 'forgot-password' || currentRoute === 'reset-password' || currentRoute === '(auth)';
    const isDashboardRoute = currentRoute === 'adminDashboard' || currentRoute === 'userDashboard' || currentRoute === 'home';
    const isCompanyRoute = currentRoute === 'company';

    // Check if user is authenticated (either via Supabase session or phone-based auth)
    const isAuthenticated = session || userProfile;

    const isAssetsRoute = currentRoute === 'assets';
    const isProfileRoute = currentRoute === 'profile';
    const isSettingsRoute = currentRoute === 'settings';

    if (!isAuthenticated) {
      // User is not signed in
      if (isDashboardRoute || isCompanyRoute || isAssetsRoute || isProfileRoute || isSettingsRoute) {
        // Trying to access protected route, redirect to login
        router.replace('/');
      }
      // If on auth route (including verifyOtp), stay there
    } else {
      // User is signed in (via email or phone)
      if (isAuthRoute) {
        // User is signed in and trying to access auth routes (login/signup)
        // Redirect to appropriate dashboard based on role
        // Note: Login/signup flows handle company checks for admins
        if (userProfile?.role === 'admin') {
          router.replace('/adminDashboard');
        } else if (userProfile?.role === 'user') {
          router.replace('/userDashboard');
        }
        // If role is not yet loaded, the effect will run again when it loads
      } else if (isDashboardRoute && userProfile) {
        // User is signed in and accessing dashboard routes
        // Ensure they're on the right dashboard based on role
        // Note: Individual pages (adminDashboard, company) handle their own redirects
        if (userProfile.role === 'admin' && currentRoute !== 'adminDashboard' && currentRoute !== 'home' && currentRoute !== 'company' && currentRoute !== 'assets') {
          router.replace('/adminDashboard');
        } else if (userProfile.role === 'user' && currentRoute !== 'userDashboard' && currentRoute !== 'home') {
          router.replace('/userDashboard');
        }
      } else if (isSettingsRoute && userProfile) {
        // Redirect non-admin users away from settings page
        if (userProfile.role !== 'admin') {
          if (userProfile.role === 'user') {
            router.replace('/userDashboard');
          } else {
            router.replace('/');
          }
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
        name="company"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="assets"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="profile"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="settings"
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
      <Stack.Screen
        name="forgot-password"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="reset-password"
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
          <ConfirmationModalProvider>
            <RootLayoutNav />
            <StatusBar style="auto" />
          </ConfirmationModalProvider>
        </AuthProvider>
      </ToastProvider>
    </PaperProvider>
  );
}

