import React, { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../src/contexts/AuthContext';
import { supabase } from '../lib/supabase';

export default function HomeScreen() {
  const router = useRouter();
  const { session, userProfile, loading } = useAuth();

  useEffect(() => {
    const checkAndRedirect = async () => {
      if (loading) return;

      if (!session) {
        // Not logged in, redirect to login
        router.replace('/');
        return;
      }

      // Redirect based on role
      if (userProfile?.role === 'admin') {
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
      } else if (userProfile?.role === 'user') {
        router.replace('/userDashboard');
      } else {
        // If role is not loaded yet, wait or redirect to login
        router.replace('/');
      }
    };

    checkAndRedirect();
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