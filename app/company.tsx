import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Button } from '../src/components/Button';
import { Input } from '../src/components/Input';
import { LoadingBar } from '../src/components/LoadingBar';
import { useToast } from '../src/components/Toast';
import { useAuth } from '../src/contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { TopBar } from '../src/components/TopBar';

export default function CompanySetupScreen() {
  const router = useRouter();
  const { showToast } = useToast();
  const { session, userProfile, user, loading: authLoading } = useAuth();
  const [companyName, setCompanyName] = useState('');
  const [country, setCountry] = useState('');
  const [state, setState] = useState('');
  const [loading, setLoading] = useState(false);
  const [checkingCompany, setCheckingCompany] = useState(true);

  // Check if user is admin and if company already exists
  useEffect(() => {
    const checkCompanyAndAccess = async () => {
      if (authLoading) return;

      // If not authenticated, redirect to login
      if (!session || !user) {
        router.replace('/');
        return;
      }

      // If not admin, redirect to appropriate dashboard
      if (userProfile?.role !== 'admin') {
        if (userProfile?.role === 'user') {
          router.replace('/userDashboard');
        } else {
          router.replace('/');
        }
        return;
      }

      try {
        // Check if company already exists for this user
        const { data: companyData, error } = await supabase
          .from('company')
          .select('id')
          .eq('user_id', user.id)
          .single();

        if (error && error.code !== 'PGRST116') {
          // PGRST116 is "not found" error, which is expected if no company exists
          console.error('Error checking company:', error);
        }

        // If company exists, redirect to dashboard
        if (companyData) {
          router.replace('/adminDashboard');
          return;
        }

        setCheckingCompany(false);
      } catch (error) {
        console.error('Error checking company:', error);
        setCheckingCompany(false);
      }
    };

    checkCompanyAndAccess();
  }, [session, user, userProfile, authLoading]);

  // Show loading while checking company
  if (checkingCompany || authLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <LoadingBar variant="bar" />
        </View>
      </SafeAreaView>
    );
  }

  const handleCreateCompany = async () => {
    // Validate required fields
    if (!companyName.trim() || !country.trim()) {
      showToast('Please fill in all required fields', 'error');
      return;
    }

    if (!user?.id) {
      showToast('User not authenticated', 'error');
      return;
    }

    setLoading(true);

    try {
      const companyData = {
        user_id: user.id,
        company_name: companyName.trim(),
        country: country.trim(),
        ...(state.trim() && { state: state.trim() }),
      };

      const { error } = await supabase
        .from('company')
        .insert([companyData]);

      if (error) {
        console.error('Error creating company:', error);
        throw new Error(error.message || 'Failed to create company');
      }

      showToast('Company created successfully!', 'success', 2000);

      // Redirect to admin dashboard after successful creation
      setTimeout(() => {
        router.replace('/adminDashboard');
      }, 2000);
    } catch (error: any) {
      console.error('Create company error:', error);
      showToast(
        error.message || 'An error occurred while creating the company. Please try again.',
        'error'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <TopBar
            title="Company Setup"
            showBack={true}
          />

          {/* Welcome Section */}
          <View style={styles.welcomeSection}>
            <Text style={styles.welcomeTitle}>Company Setup</Text>
            <Text style={styles.welcomeSubtitle}>
              Please provide your company information to get started with Redi Fleet.
            </Text>
          </View>

          {/* Company Form */}
          <View style={styles.contentSection}>
            <View style={styles.formContainer}>
              <View style={styles.inputContainer}>
                <Input
                  variant="text"
                  label="Company Name *"
                  value={companyName}
                  onChangeText={setCompanyName}
                  style={styles.input}
                  autoCapitalize="words"
                  placeholder="Enter company name"
                />
                <Input
                  variant="text"
                  label="Country *"
                  value={country}
                  onChangeText={setCountry}
                  style={styles.input}
                  autoCapitalize="words"
                  placeholder="Enter country"
                />
                <Input
                  variant="text"
                  label="State (Optional)"
                  value={state}
                  onChangeText={setState}
                  style={styles.input}
                  autoCapitalize="words"
                  placeholder="Enter state or province"
                />
              </View>

              <View style={styles.formButtonsContainer}>
                <Button
                  variant="gradient"
                  title={loading ? 'Creating Company...' : 'Create Company'}
                  onPress={handleCreateCompany}
                  disabled={loading}
                  style={styles.createButton}
                />
                {loading && (
                  <View style={styles.loadingBarContainer}>
                    <LoadingBar variant="bar" />
                  </View>
                )}
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 32,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  welcomeSection: {
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  welcomeTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 8,
    textAlign: 'center',
  },
  welcomeSubtitle: {
    fontSize: 16,
    color: '#666',
    lineHeight: 24,
    textAlign: 'center',
  },
  contentSection: {
    paddingHorizontal: 20,
  },
  formContainer: {
    padding: 20,
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  inputContainer: {
    width: '100%',
  },
  input: {
    marginBottom: 16,
  },
  formButtonsContainer: {
    marginTop: 24,
    alignItems: 'center',
  },
  createButton: {
    maxWidth: 400,
    marginBottom: 12,
  },
  loadingBarContainer: {
    marginTop: 8,
    width: '100%',
    maxWidth: 400,
    marginBottom: 12,
  },
});

