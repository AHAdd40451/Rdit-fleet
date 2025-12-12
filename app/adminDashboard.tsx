import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  Image,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Button } from '../src/components/Button';
import { Input } from '../src/components/Input';
import { LoadingBar } from '../src/components/LoadingBar';
import { useAuth } from '../src/contexts/AuthContext';
import { useToast } from '../src/components/Toast';
import { supabase } from '../lib/supabase';
import { BottomNavBar } from '../src/components/BottomNavBar';

const TEAL_GREEN = '#14AB98';
const BRIGHT_GREEN = '#B0E56D';

export default function AdminDashboardScreen() {
  const router = useRouter();
  const { signOut, userProfile, user, session } = useAuth();
  const { showToast } = useToast();
  
  // Add user form state
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [showAddUserForm, setShowAddUserForm] = useState(false);
  const [checkingCompany, setCheckingCompany] = useState(true);

  // Check if company exists for admin user
  useEffect(() => {
    const checkCompany = async () => {
      if (!session?.user?.id || userProfile?.role !== 'admin') {
        setCheckingCompany(false);
        return;
      }

      try {
        const { data: companyData, error } = await supabase
          .from('company')
          .select('id')
          .eq('user_id', session.user.id)
          .single();

        // If company doesn't exist, redirect to company setup page
        if (error || !companyData) {
          router.replace('/company');
          return;
        }

        setCheckingCompany(false);
      } catch (error) {
        console.error('Error checking company:', error);
        setCheckingCompany(false);
      }
    };

    checkCompany();
  }, [session, userProfile, router]);

  const handleLogout = async () => {
    await signOut();
    router.replace('/');
  };

  const handleAddUser = async () => {
    if (!firstName || !lastName || !phoneNumber) {
      showToast('Please fill in all fields', 'error');
      return;
    }

    // Validate phone number format
    const phoneRegex = /^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/;
    if (!phoneRegex.test(phoneNumber.replace(/\s/g, ''))) {
      showToast('Please enter a valid phone number', 'error');
      return;
    }

    setLoading(true);

    try {
      const userData: any = {
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        phone_no: phoneNumber.trim(),
        role: 'user',
      };

      const { error: dbError } = await supabase
        .from('users')
        .insert([userData]);

      if (dbError) {
        console.error('Database error:', dbError);
        const errorMessage = dbError.message || 'Failed to create user profile.';
        throw new Error(
          `Database error: ${errorMessage}. Please check your table structure.`
        );
      }

      showToast('User created successfully!', 'success', 2000);
      
      // Reset form
      setFirstName('');
      setLastName('');
      setPhoneNumber('');
      setShowAddUserForm(false);
    } catch (error: any) {
      console.error('Add user error:', error);
      showToast(
        error.message || 'An error occurred while creating the user. Please try again.',
        'error'
      );
    } finally {
      setLoading(false);
    }
  };

  // Show loading while checking company
  if (checkingCompany) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingFullContainer}>
          <LoadingBar variant="bar" />
        </View>
      </SafeAreaView>
    );
  }

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
          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <Image
                source={require('../assets/logo.png')}
                style={styles.logoImage}
                resizeMode="contain"
              />
            </View>
            <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
              <Text style={styles.logoutText}>Logout</Text>
            </TouchableOpacity>
          </View>

          {/* Welcome Section */}
          <View style={styles.welcomeSection}>
            <Text style={styles.welcomeTitle}>Admin Dashboard</Text>
            <Text style={styles.welcomeSubtitle}>
              Welcome, {userProfile?.first_name || 'Admin'}! Manage your fleet efficiently with smart reminders and predictive maintenance.
            </Text>
          </View>

          {/* Add User Section */}
          <View style={styles.contentSection}>
            
              <View style={styles.addUserForm}>
                <Text style={styles.formTitle}>Create New User</Text>
                
                <View style={styles.inputContainer}>
                  <Input
                    variant="text"
                    label="First Name"
                    value={firstName}
                    onChangeText={setFirstName}
                    style={styles.input}
                    autoCapitalize="words"
                  />
                  <Input
                    variant="text"
                    label="Last Name"
                    value={lastName}
                    onChangeText={setLastName}
                    style={styles.input}
                    autoCapitalize="words"
                  />
                  <Input
                    variant="text"
                    label="Phone Number"
                    value={phoneNumber}
                    onChangeText={setPhoneNumber}
                    style={styles.input}
                    keyboardType="phone-pad"
                    placeholder="Phone Number"
                  />
                </View>

                <View style={styles.formButtonsContainer}>
                  <Button
                    variant="gradient"
                    title={loading ? 'Creating User...' : 'Create User'}
                    onPress={handleAddUser}
                    disabled={loading}
                    style={styles.createButton}
                  />
                  {loading && (
                    <View style={styles.loadingContainer}>
                      <LoadingBar variant="bar" />
                    </View>
                  )}
                </View>
              </View>
            
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
      <BottomNavBar />
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
    paddingBottom: 100,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
  },
  logoContainer: {
    alignItems: 'center',
  },
  logoImage: {
    width: 120,
    height: 70,
  },
  logoutButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  logoutText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
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
  },
  welcomeSubtitle: {
    fontSize: 16,
    color: '#666',
    lineHeight: 24,
  },
  contentSection: {
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 8,
  },
  sectionText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 16,
  },
  addUserButtonContainer: {
    marginTop: 8,
    alignItems: 'center',
  },
  addUserButton: {
    maxWidth: 300,
  },
  addUserForm: {
    marginTop: 16,
    padding: 20,
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  formTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 20,
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
    maxWidth: 300,
    marginBottom: 12,
  },
  loadingContainer: {
    marginTop: 8,
    width: '100%',
    maxWidth: 300,
    marginBottom: 12,
  },
  loadingFullContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
});

