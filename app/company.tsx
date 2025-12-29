import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
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
  const [legalName, setLegalName] = useState('');
  const [phone, setPhone] = useState('');
  const [supportEmail, setSupportEmail] = useState('');
  const [address, setAddress] = useState('');
  const [timezone, setTimezone] = useState('');
  const [units, setUnits] = useState<'imperial' | 'metric'>('imperial');
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

    if (supportEmail.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(supportEmail.trim())) {
        showToast('Please enter a valid support email address', 'error');
        return;
      }
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
        ...(legalName.trim() && { legal_name: legalName.trim() }),
        ...(phone.trim() && { phone: phone.trim() }),
        ...(supportEmail.trim() && { support_email: supportEmail.trim() }),
        ...(address.trim() && { address: address.trim() }),
        ...(timezone.trim() && { timezone: timezone.trim() }),
        units: units,
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
                <Input
                  variant="text"
                  label="Legal Name (Optional)"
                  value={legalName}
                  onChangeText={setLegalName}
                  style={styles.input}
                  autoCapitalize="words"
                  placeholder="Enter legal company name"
                />
                <Input
                  variant="text"
                  label="Phone (Optional)"
                  value={phone}
                  onChangeText={setPhone}
                  style={styles.input}
                  keyboardType="phone-pad"
                  placeholder="Enter company phone number"
                />
                <Input
                  variant="text"
                  label="Support Email (Optional)"
                  value={supportEmail}
                  onChangeText={setSupportEmail}
                  style={styles.input}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  placeholder="Enter support email address"
                />
                <Input
                  variant="text"
                  label="Address (Optional)"
                  value={address}
                  onChangeText={setAddress}
                  style={styles.input}
                  autoCapitalize="words"
                  multiline
                  numberOfLines={3}
                  placeholder="Enter company address"
                />
                <Input
                  variant="text"
                  label="Timezone (Optional)"
                  value={timezone}
                  onChangeText={setTimezone}
                  style={styles.input}
                  autoCapitalize="none"
                  placeholder="Enter timezone (e.g., America/New_York)"
                />
                <View style={styles.unitsContainer}>
                  <Text style={styles.unitsLabel}>Units *</Text>
                  <View style={styles.unitsButtons}>
                    <TouchableOpacity
                      style={[
                        styles.unitButton,
                        units === 'imperial' && styles.unitButtonActive,
                      ]}
                      onPress={() => setUnits('imperial')}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.unitButtonText,
                          units === 'imperial' && styles.unitButtonTextActive,
                        ]}
                      >
                        Imperial
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.unitButton,
                        units === 'metric' && styles.unitButtonActive,
                      ]}
                      onPress={() => setUnits('metric')}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.unitButtonText,
                          units === 'metric' && styles.unitButtonTextActive,
                        ]}
                      >
                        Metric
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
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
  unitsContainer: {
    marginBottom: 16,
  },
  unitsLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
    marginBottom: 8,
  },
  unitsButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  unitButton: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  unitButtonActive: {
    borderColor: '#14AB98',
    backgroundColor: '#14AB98',
  },
  unitButtonText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  unitButtonTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
});

