import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Button } from '../src/components/Button';
import { Input } from '../src/components/Input';
import { LoadingBar } from '../src/components/LoadingBar';
import { useAuth } from '../src/contexts/AuthContext';
import { useToast } from '../src/components/Toast';
import { supabase } from '../lib/supabase';
import { BottomNavBar } from '../src/components/BottomNavBar';
import { UsersTable } from '../src/components/UsersTable';
import { UserModal } from '../src/components/UserModal';
import { Sidebar } from '../src/components/Sidebar';
import { TopBar } from '../src/components/TopBar';
import { AdminDashboardSkeleton } from '../src/components/SkeletonScreens';

const TEAL_GREEN = '#14AB98';
const BRIGHT_GREEN = '#B0E56D';

export default function AdminDashboardScreen() {
  const router = useRouter();
  const { userProfile, user, session } = useAuth();
  const { showToast } = useToast();
  
  // Modal and user management state
  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [checkingCompany, setCheckingCompany] = useState(true);
  const [refreshUsersTable, setRefreshUsersTable] = useState(0);
  const [sidebarVisible, setSidebarVisible] = useState(false);

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
        let currentUserId = session?.user?.id;
        
        // If session is not available, try to get it directly from Supabase
        // This handles cases where the session might not be loaded in context yet
        if (!currentUserId) {
          const { data: { session: currentSession } } = await supabase.auth.getSession();
          currentUserId = currentSession?.user?.id;
        }
        
        // Fallback to userProfile.id if still not available (for phone-based users)
        // Note: userProfile.id is numeric, but userId field may accept it
        if (!currentUserId) {
          currentUserId = userProfile?.id?.toString();
        }
        
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
    return <AdminDashboardSkeleton />;
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        {/* Header */}
        <TopBar
          title="Admin Dashboard"
          showHamburger={true}
          onHamburgerPress={() => setSidebarVisible(true)}
        />

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={true}
          scrollEnabled={true}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          nestedScrollEnabled={true}
          bounces={false}
        >
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
      <Sidebar visible={sidebarVisible} onClose={() => setSidebarVisible(false)} />
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

