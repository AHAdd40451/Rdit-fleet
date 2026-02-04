import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
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
import { generateUUIDFromString } from '../src/utils/generateUUID';

const TEAL_GREEN = '#14AB98';
const BRIGHT_GREEN = '#B0E56D';
const SCREEN_WIDTH = Dimensions.get('window').width;

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
  
  // Dashboard stats state
  const [totalUsers, setTotalUsers] = useState(0);
  const [totalAssets, setTotalAssets] = useState(0);
  const [dashboardLoading, setDashboardLoading] = useState(true);

  // Check if company exists for admin user and fetch dashboard stats
  useEffect(() => {
    const checkCompanyAndFetchStats = async () => {
      if (!session?.user?.id || userProfile?.role !== 'admin') {
        setCheckingCompany(false);
        setDashboardLoading(false);
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

        // Fetch dashboard statistics
        await fetchDashboardStats();
      } catch (error) {
        console.error('Error checking company:', error);
        setCheckingCompany(false);
        setDashboardLoading(false);
      }
    };

    checkCompanyAndFetchStats();
  }, [session, userProfile, router]);

  const fetchDashboardStats = async () => {
    try {
      setDashboardLoading(true);

      // Determine the filter user ID (same logic as handleSaveUser)
      let filterUserId = session?.user?.id;
      
      // If session is not available, try to get it directly from Supabase
      if (!filterUserId) {
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        filterUserId = currentSession?.user?.id;
      }
      
      // Fallback: generate UUID from phone or user ID (for phone-based admins)
      if (!filterUserId && userProfile) {
        const identifier = userProfile.phone_no || `user_${userProfile.id}`;
        filterUserId = generateUUIDFromString(identifier);
      }

      if (!filterUserId) {
        console.warn('No filterUserId available for dashboard stats');
        setTotalUsers(0);
        setTotalAssets(0);
        setDashboardLoading(false);
        return;
      }

      console.log('Fetching dashboard stats with filterUserId:', filterUserId);

      // Fetch total users (users created by this admin)
      // Try with the filterUserId first
      let { count: usersCount, error: usersError } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .eq('userId', filterUserId);
      
      // If no results and we have userProfile.id, also try with numeric ID (fallback)
      if ((usersError || usersCount === 0) && userProfile?.id) {
        const numericIdString = userProfile.id.toString();
        console.log('Trying with numeric ID fallback:', numericIdString);
        const { count: fallbackCount, error: fallbackError } = await supabase
          .from('users')
          .select('*', { count: 'exact', head: true })
          .eq('userId', numericIdString);
        
        if (!fallbackError && fallbackCount !== null) {
          usersCount = fallbackCount;
          usersError = null;
        }
      }
      
      if (usersError) {
        console.error('Error fetching users count:', usersError);
      } else {
        console.log('Users count:', usersCount);
        setTotalUsers(usersCount || 0);
      }

      // Fetch total assets (assets belonging to this admin)
      // Try with the filterUserId first
      let { count: assetsCount, error: assetsError } = await supabase
        .from('assets')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', filterUserId);
      
      // If no results and we have userProfile.id, also try with numeric ID (fallback)
      if ((assetsError || assetsCount === 0) && userProfile?.id) {
        const numericIdString = userProfile.id.toString();
        console.log('Trying assets with numeric ID fallback:', numericIdString);
        const { count: fallbackCount, error: fallbackError } = await supabase
          .from('assets')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', numericIdString);
        
        if (!fallbackError && fallbackCount !== null) {
          assetsCount = fallbackCount;
          assetsError = null;
        }
      }
      
      if (assetsError) {
        console.error('Error fetching assets count:', assetsError);
      } else {
        console.log('Assets count:', assetsCount);
        setTotalAssets(assetsCount || 0);
      }
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    } finally {
      setDashboardLoading(false);
    }
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
      // Refresh dashboard stats
      await fetchDashboardStats();
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
          {/* Welcome Card with Gradient */}
          <LinearGradient
            colors={[TEAL_GREEN, BRIGHT_GREEN]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.welcomeCard}
          >
            <View style={styles.welcomeContent}>
              <View style={styles.welcomeTextContainer}>
                <Text style={styles.welcomeGreeting}>Welcome back,</Text>
                <Text style={styles.welcomeName}>
                  {userProfile?.first_name || 'Admin'}!
                </Text>
                <Text style={styles.welcomeSubtitle}>
                  Manage your fleet efficiently with smart reminders and predictive maintenance.
                </Text>
              </View>
              <View style={styles.welcomeIconContainer}>
                <Ionicons name="shield-checkmark" size={48} color="#fff" />
              </View>
            </View>
          </LinearGradient>

          {/* Stats Cards */}
          <View style={styles.statsContainer}>
            <TouchableOpacity
              style={styles.statCard}
              onPress={() => {
                // Scroll to users section or highlight it
                setRefreshUsersTable(prev => prev + 1);
              }}
              activeOpacity={0.7}
            >
              <View style={[styles.statIconContainer, { backgroundColor: `${TEAL_GREEN}15` }]}>
                <Ionicons name="people-outline" size={24} color={TEAL_GREEN} />
              </View>
              <Text style={styles.statValue}>{totalUsers}</Text>
              <Text style={styles.statLabel}>Total Users</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.statCard}
              onPress={() => router.push('/assets')}
              activeOpacity={0.7}
            >
              <View style={[styles.statIconContainer, { backgroundColor: `${BRIGHT_GREEN}15` }]}>
                <Ionicons name="car-outline" size={24} color={BRIGHT_GREEN} />
              </View>
              <Text style={styles.statValue}>{totalAssets}</Text>
              <Text style={styles.statLabel}>Total Assets</Text>
            </TouchableOpacity>
          </View>

          {/* Quick Actions */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Quick Actions</Text>
            <View style={styles.quickActionsContainer}>
              <TouchableOpacity
                style={styles.quickActionCard}
                onPress={handleAddUser}
                activeOpacity={0.7}
              >
                <LinearGradient
                  colors={[TEAL_GREEN, `${TEAL_GREEN}DD`]}
                  style={styles.quickActionGradient}
                >
                  <Ionicons name="person-add" size={28} color="#fff" />
                  <Text style={styles.quickActionText}>Add User</Text>
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.quickActionCard}
                onPress={() => router.push('/assets')}
                activeOpacity={0.7}
              >
                <LinearGradient
                  colors={[BRIGHT_GREEN, `${BRIGHT_GREEN}DD`]}
                  style={styles.quickActionGradient}
                >
                  <Ionicons name="car" size={28} color="#fff" />
                  <Text style={styles.quickActionText}>View Assets</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
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
    backgroundColor: '#F5F5F5',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  welcomeCard: {
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 24,
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  welcomeContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  welcomeTextContainer: {
    flex: 1,
    marginRight: 16,
  },
  welcomeGreeting: {
    fontSize: 16,
    color: '#fff',
    opacity: 0.9,
    marginBottom: 4,
  },
  welcomeName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  welcomeSubtitle: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.9,
    lineHeight: 20,
  },
  welcomeIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 24,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  statIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  statValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 16,
  },
  quickActionsContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  quickActionCard: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  quickActionGradient: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 100,
  },
  quickActionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    marginTop: 8,
  },
  contentSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
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
    flexWrap: 'wrap',
    marginBottom: 16,
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

