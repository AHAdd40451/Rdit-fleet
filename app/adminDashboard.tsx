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
import { useConfirmationModal } from '../src/contexts/ConfirmationModalContext';
import { useToast } from '../src/components/Toast';
import { supabase } from '../lib/supabase';
import { BottomNavBar } from '../src/components/BottomNavBar';
import { UsersTable } from '../src/components/UsersTable';
import { UserModal } from '../src/components/UserModal';

const TEAL_GREEN = '#14AB98';
const BRIGHT_GREEN = '#B0E56D';

export default function AdminDashboardScreen() {
  const router = useRouter();
  const { signOut, userProfile, user, session } = useAuth();
  const { showToast } = useToast();
  const { showConfirmation } = useConfirmationModal();
  
  // Modal and user management state
  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [checkingCompany, setCheckingCompany] = useState(true);
  const [refreshUsersTable, setRefreshUsersTable] = useState(0);

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

  const handleLogout = () => {
    showConfirmation({
      title: 'Logout',
      message: 'Are you sure you want to logout?',
      confirmText: 'Logout',
      cancelText: 'Cancel',
      onConfirm: async () => {
        await signOut();
        router.replace('/');
      },
    });
  };

  const handleSaveUser = async (userData: any) => {
    setLoading(true);

    try {
      if (editingUser) {
        // Update existing user
        const { error: updateError } = await supabase
          .from('users')
          .update(userData)
          .eq('id', editingUser.id);

        if (updateError) {
          console.error('Database error:', updateError);
          const errorMessage = updateError.message || 'Failed to update user.';
          throw new Error(
            `Database error: ${errorMessage}. Please check your table structure.`
          );
        }

        showToast('User updated successfully!', 'success', 2000);
      } else {
        // Create new user
        // Get current admin user ID
        const currentUserId = session?.user?.id || userProfile?.id;
        
        if (!currentUserId) {
          throw new Error('Unable to identify current user. Please log in again.');
        }

        const newUserData = {
          ...userData,
          role: 'user',
          userId: currentUserId, // Save the admin user ID who created this user
        };

        const { error: insertError } = await supabase
          .from('users')
          .insert([newUserData]);

        if (insertError) {
          console.error('Database error:', insertError);
          const errorMessage = insertError.message || 'Failed to create user profile.';
          throw new Error(
            `Database error: ${errorMessage}. Please check your table structure.`
          );
        }

        showToast('User created successfully!', 'success', 2000);
      }

      // Close modal and refresh table
      setShowUserModal(false);
      setEditingUser(null);
      setRefreshUsersTable(prev => prev + 1);
    } catch (error: any) {
      console.error('Save user error:', error);
      showToast(
        error.message || 'An error occurred. Please try again.',
        'error'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleAddUser = () => {
    setEditingUser(null);
    setShowUserModal(true);
  };

  const handleEditUser = (user: any) => {
    setEditingUser(user);
    setShowUserModal(true);
  };

  const handleCloseModal = () => {
    if (!loading) {
      setShowUserModal(false);
      setEditingUser(null);
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

          {/* Users Table Section */}
          <View style={styles.contentSection}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionHeaderText}>
                <Text style={styles.sectionTitle}>All Users</Text>
                <Text style={styles.sectionText}>
                  View and manage all users in your system.
                </Text>
              </View>
              <View style={styles.addUserButtonContainer}>
                <Button
                  variant="gradient"
                  title="Add User"
                  onPress={handleAddUser}
                  style={styles.addUserButton}
                />
              </View>
            </View>
            <UsersTable
              key={refreshUsersTable}
              onEditUser={handleEditUser}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
      <BottomNavBar />
      <UserModal
        visible={showUserModal}
        onClose={handleCloseModal}
        onSave={handleSaveUser}
        editingUser={editingUser}
        loading={loading}
      />
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
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    // marginBottom: 16,
    flexWrap: 'wrap',
  },
  sectionHeaderText: {
    flex: 1,
    minWidth: 200,
    marginRight: 12,
    marginBottom: 8,
  },
  addUserButtonContainer: {
    alignItems: 'flex-end',
    justifyContent: 'flex-start',
    marginBottom: 8,
  },
  addUserButton: {
    minWidth: 120,
    maxWidth: 150,
  },
  loadingFullContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
});

