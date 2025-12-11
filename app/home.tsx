import React, { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../src/contexts/AuthContext';

export default function HomeScreen() {
  const router = useRouter();
  const { session, userProfile, loading } = useAuth();

  useEffect(() => {
    if (loading) return;

    if (!session) {
      // Not logged in, redirect to login
      router.replace('/');
      return;
    }

    // Redirect based on role
    if (userProfile?.role === 'admin') {
      router.replace('/adminDashboard');
    } else if (userProfile?.role === 'user') {
      router.replace('/userDashboard');
    } else {
      // If role is not loaded yet, wait or redirect to login
      router.replace('/');
    }
  }, [session, userProfile, loading]);

  // Show loading indicator while redirecting
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#14AB98" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
});