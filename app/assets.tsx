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
import { LoadingBar } from '../src/components/LoadingBar';
import { useAuth } from '../src/contexts/AuthContext';
import { useConfirmationModal } from '../src/contexts/ConfirmationModalContext';
import { useToast } from '../src/components/Toast';
import { supabase } from '../lib/supabase';
import { BottomNavBar } from '../src/components/BottomNavBar';
import { AssetsTable } from '../src/components/AssetsTable';
import { AssetModal } from '../src/components/AssetModal';
import { AssetBottomSheet } from '../src/components/AssetBottomSheet';
import { TopBar } from '../src/components/TopBar';
import { Sidebar } from '../src/components/Sidebar';
import { generateUUIDFromString } from '../src/utils/generateUUID';
import { callRapidFunction } from '../src/utils/callRapidFunction';

const TEAL_GREEN = '#14AB98';
const BRIGHT_GREEN = '#B0E56D';

interface Asset {
  id?: string;
  asset_name: string;
  color: string;
  vin: string;
  make: string;
  model: string;
  year: number | null;
  odometer: number | null;
  mileage: number | null;
  user_id: string;
  photo?: string | null;
  photos?: string[] | null;
  state?: string | null;
}

export default function AssetsScreen() {
  const router = useRouter();
  const { signOut, userProfile, user, session } = useAuth();
  const { showToast } = useToast();
  const { showConfirmation } = useConfirmationModal();
  
  // Modal and asset management state
  const [showAssetModal, setShowAssetModal] = useState(false);
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);
  const [loading, setLoading] = useState(false);
  const [checkingCompany, setCheckingCompany] = useState(true);
  const [refreshAssetsTable, setRefreshAssetsTable] = useState(0);
  const [showBottomSheet, setShowBottomSheet] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
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

  // Redirect non-admin users to userAssets page
  useEffect(() => {
    if (userProfile?.role === 'user' && !checkingCompany) {
      router.replace('/userAssets');
    }
  }, [userProfile, checkingCompany, router]);

  const handleSaveAsset = async (assetData: Omit<Asset, 'id' | 'user_id'>) => {
    setLoading(true);

    try {
      // Assets table uses UUID (from Supabase auth session.user.id)
      // Must use UUID, not numeric userProfile.id
      let currentUserId = session?.user?.id;
      
      // If session is not available, try to get it directly from Supabase
      // This handles cases where the session might not be loaded in context yet
      if (!currentUserId) {
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        currentUserId = currentSession?.user?.id;
      }
      
      // For phone-based users: check if they have a Supabase Auth account
      // If not, we need to create one or use an alternative approach
      if (!currentUserId && userProfile) {
        // If user doesn't have an email, generate a deterministic UUID from their phone number or ID
        if (!userProfile.email) {
          // Generate a deterministic UUID from phone number (preferred) or user ID
          const identifier = userProfile.phone_no || `user_${userProfile.id}`;
          currentUserId = generateUUIDFromString(identifier);
          
          console.log('Generated UUID for user without email:', currentUserId);
          
          // For users without email, we use the generated UUID directly
          // No need to create Supabase Auth account
        }

        // User has email - try to get or create Supabase Auth account
        // First, check if user is already signed in (might have been signed in during phone login)
        try {
          const { data: { user: authUser } } = await supabase.auth.getUser();
          if (authUser && authUser.email === userProfile.email) {
            currentUserId = authUser.id;
          }
        } catch (getUserError) {
          // User not signed in, continue to create account
          console.log('User not signed in, will create auth account if needed');
        }

        // If still no user ID, try to create a Supabase Auth account
        if (!currentUserId && userProfile.email) {
          try {
            // Generate a secure random password (user won't need to use it for phone login)
            const tempPassword = `phone_${userProfile.id}_${Date.now()}_${Math.random().toString(36).slice(-8)}`;
            
            // Try to sign up (create new auth account)
            const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
              email: userProfile.email,
              password: tempPassword,
              options: {
                emailRedirectTo: undefined, // No email confirmation needed for phone-based users
              }
            });

            if (signUpError) {
              // If sign up fails, check if it's because user already exists
              if (signUpError.message.includes('already registered') || 
                  signUpError.message.includes('already exists') ||
                  signUpError.message.includes('User already registered')) {
                // User already exists in auth but we're not signed in
                // This means the account was created but we don't have the session
                // We need to sign in, but we don't know the password
                // For now, show a helpful error message
                throw new Error('Your account requires email/password authentication. Please sign out and sign in with your email and password, or contact support to reset your password.');
              } else {
                throw signUpError;
              }
            } else if (signUpData.user) {
              // Successfully created auth account
              currentUserId = signUpData.user.id;
              
              // Sign in with the new account to establish session
              const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
                email: userProfile.email,
                password: tempPassword,
              });
              
              if (signInError) {
                console.error('Error signing in after account creation:', signInError);
                // Even if sign in fails, we have the user ID, so continue
              } else if (signInData.user) {
                // Session established - AuthContext will pick this up via onAuthStateChange
                console.log('Supabase Auth session established for phone user');
              }
            }
          } catch (authError: any) {
            console.error('Error setting up Supabase Auth for phone user:', authError);
            // If it's our custom error, throw it as is
            if (authError.message && authError.message.includes('requires email/password')) {
              throw authError;
            }
            throw new Error('Unable to set up authentication. Please contact support or sign in with email and password.');
          }
        }
      }
      
      if (!currentUserId) {
        throw new Error('Unable to identify current user. Please log in again.');
      }

      // Only admins can create assets, but both admins and users can update
      if (!editingAsset && userProfile?.role !== 'admin') {
        throw new Error('You do not have permission to create assets. Only admins can create new assets.');
      }

      if (editingAsset) {
        // Update existing asset - both admins and users can do this
        // First, fetch the current asset to get old values for logging
        const { data: currentAsset, error: fetchError } = await supabase
          .from('assets')
          .select('*')
          .eq('id', editingAsset.id)
          .single();

        if (fetchError) {
          console.error('Error fetching current asset:', fetchError);
          throw new Error('Failed to fetch current asset data.');
        }

        // Update the asset
        const { error: updateError } = await supabase
          .from('assets')
          .update(assetData)
          .eq('id', editingAsset.id);

        if (updateError) {
          console.error('Database error:', updateError);
          const errorMessage = updateError.message || 'Failed to update asset.';
          throw new Error(
            `Database error: ${errorMessage}. Please check your table structure.`
          );
        }

        // Create log entry for asset update
        try {
          const oldValues: any = {};
          const newValues: any = {};
          const changes: any = {};

          // Compare old and new values to track changes
          Object.keys(assetData).forEach((key) => {
            const typedKey = key as keyof typeof assetData;
            const oldValue = currentAsset?.[typedKey];
            const newValue = assetData[typedKey];

            if (oldValue !== newValue) {
              oldValues[key] = oldValue;
              newValues[key] = newValue;
              changes[key] = { from: oldValue, to: newValue };
            }
          });

          // If there are changes, log them
          if (Object.keys(changes).length > 0) {
            const logEntry = {
              asset_id: editingAsset.id,
              user_id: currentUserId,
              action: 'updated',
              user_role: userProfile?.role || 'user',
              changes: changes,
              old_values: oldValues,
              new_values: newValues,
              description: `${userProfile?.role === 'admin' ? 'Admin' : 'User'} updated asset "${assetData.asset_name || editingAsset.asset_name}"`,
            };

            const { error: logError } = await supabase
              .from('asset_logs')
              .insert([logEntry]);

            if (logError) {
              console.error('Error creating asset log:', logError);
              // Don't throw error here, asset was updated successfully
            }
          }
        } catch (logErr) {
          console.error('Error in log creation:', logErr);
          // Don't throw error here, asset was updated successfully
        }

        // Call rapid-function edge function if mileage > 5000
        if (assetData.mileage && assetData.mileage > 5000) {
          try {
            await callRapidFunction({
              asset_id: editingAsset.id,
              asset_name: assetData.asset_name || editingAsset.asset_name,
              mileage: assetData.mileage,
              user_id: currentUserId,
              user_email: userProfile?.email || user?.email,
            });
          } catch (rapidFunctionError) {
            console.error('Error calling rapid-function:', rapidFunctionError);
            // Don't throw error here, asset was updated successfully
          }
        }

        showToast('Asset updated successfully!', 'success', 2000);
      } else {
        // Create new asset - only admins can do this
        const newAssetData = {
          ...assetData,
          user_id: currentUserId,
        };

        const { data: insertedAsset, error: insertError } = await supabase
          .from('assets')
          .insert([newAssetData])
          .select()
          .single();

        if (insertError) {
          console.error('Database error:', insertError);
          const errorMessage = insertError.message || 'Failed to create asset.';
          throw new Error(
            `Database error: ${errorMessage}. Please check your table structure.`
          );
        }

        // Create log entry for asset creation
        try {
          const logEntry = {
            asset_id: insertedAsset.id,
            user_id: currentUserId,
            action: 'created',
            user_role: 'admin',
            changes: null,
            old_values: null,
            new_values: newAssetData,
            description: `Admin created new asset "${assetData.asset_name}"`,
          };

          const { error: logError } = await supabase
            .from('asset_logs')
            .insert([logEntry]);

          if (logError) {
            console.error('Error creating asset log:', logError);
            // Don't throw error here, asset was created successfully
          }
        } catch (logErr) {
          console.error('Error in log creation:', logErr);
          // Don't throw error here, asset was created successfully
        }

        // Create notifications for all users linked to this admin
        if (insertedAsset && userProfile?.role === 'admin') {
          try {
            // Find all users where userId matches the admin's ID
            const { data: linkedUsers, error: usersError } = await supabase
              .from('users')
              .select('id')
              .eq('userId', currentUserId)
              .eq('role', 'user');

            if (!usersError && linkedUsers && linkedUsers.length > 0) {
              // Create notifications for each linked user
              const notifications = linkedUsers.map(user => ({
                user_id: user.id,
                message: `New asset "${assetData.asset_name}" has been created by your admin.`,
                type: 'asset_created',
                asset_id: insertedAsset.id,
                read: false,
                created_at: new Date().toISOString(),
              }));

              const { error: notificationError } = await supabase
                .from('notifications')
                .insert(notifications);

              if (notificationError) {
                console.error('Error creating notifications:', notificationError);
                // Don't throw error here, asset was created successfully
              }
            }
          } catch (notificationErr) {
            console.error('Error in notification creation:', notificationErr);
            // Don't throw error here, asset was created successfully
          }
        }

        // Call rapid-function edge function if mileage > 5000
        if (assetData.mileage && assetData.mileage > 5000) {
          try {
            await callRapidFunction({
              asset_id: insertedAsset.id,
              asset_name: assetData.asset_name,
              mileage: assetData.mileage,
              user_id: currentUserId,
              user_email: userProfile?.email || user?.email,
            });
          } catch (rapidFunctionError) {
            console.error('Error calling rapid-function:', rapidFunctionError);
            // Don't throw error here, asset was created successfully
          }
        }

        showToast('Asset created successfully!', 'success', 2000);
      }

      // Close modal and refresh table
      setShowAssetModal(false);
      setEditingAsset(null);
      setRefreshAssetsTable(prev => prev + 1);
    } catch (error: any) {
      console.error('Save asset error:', error);
      showToast(
        error.message || 'An error occurred. Please try again.',
        'error'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleAddAsset = () => {
    setEditingAsset(null);
    setShowAssetModal(true);
  };

  const handleEditAsset = (asset: Asset) => {
    // Both admins and users can edit assets
    setEditingAsset(asset);
    setShowAssetModal(true);
  };

  const handleAssetClick = (asset: Asset) => {
    setSelectedAsset(asset);
    setShowBottomSheet(true);
  };

  const handleCloseBottomSheet = () => {
    setShowBottomSheet(false);
    setSelectedAsset(null);
  };

  const handlePhotosUpdate = async (assetId: string, photos: string[]) => {
    try {
      // Only admins can update photos
      if (userProfile?.role !== 'admin') {
        throw new Error('You do not have permission to update photos.');
      }

      // Update the asset with the new photos array
      const { error: updateError } = await supabase
        .from('assets')
        .update({ photos: photos })
        .eq('id', assetId);

      if (updateError) {
        console.error('Database error:', updateError);
        throw new Error('Failed to update photos.');
      }

      // Update the selected asset in state to reflect the change
      if (selectedAsset && selectedAsset.id === assetId) {
        setSelectedAsset({ ...selectedAsset, photos: photos });
      }

      // Refresh the assets table
      setRefreshAssetsTable(prev => prev + 1);
      
      showToast('Photos updated successfully!', 'success', 2000);
    } catch (error: any) {
      console.error('Update photos error:', error);
      showToast(
        error.message || 'An error occurred while updating photos.',
        'error'
      );
    }
  };

  const handleCloseModal = () => {
    if (!loading) {
      setShowAssetModal(false);
      setEditingAsset(null);
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

  // Only show admin view - users are redirected to userAssets
  if (userProfile?.role !== 'admin') {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingFullContainer}>
          <LoadingBar variant="bar" />
        </View>
      </SafeAreaView>
    );
  }
  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        {/* Header */}
        <TopBar
          title="Assets"
          showHamburger={true}
          onHamburgerPress={() => setSidebarVisible(true)}
        />

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Welcome Section */}
          <View style={styles.welcomeSection}>
            <Text style={styles.welcomeTitle}>Assets Management</Text>
            <Text style={styles.welcomeSubtitle}>
              Welcome, {userProfile?.first_name || 'Admin'}! Manage your fleet assets efficiently.
            </Text>
          </View>

          {/* Assets Table Section */}
          <View style={styles.contentSection}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionHeaderText}>
                <Text style={styles.sectionTitle}>All Assets</Text>
                <Text style={styles.sectionText}>
                  View and manage all assets in your fleet.
                </Text>
              </View>
              {userProfile?.role === 'admin' && (
                <View style={styles.addAssetButtonContainer}>
                  <Button
                    variant="gradient"
                    title="Add Asset"
                    onPress={handleAddAsset}
                    style={styles.addAssetButton}
                  />
                </View>
              )}
            </View>
            <AssetsTable
              key={refreshAssetsTable}
              onEditAsset={handleEditAsset}
              onAssetClick={handleAssetClick}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
      <BottomNavBar />
      <Sidebar visible={sidebarVisible} onClose={() => setSidebarVisible(false)} />
      <AssetModal
        visible={showAssetModal}
        onClose={handleCloseModal}
        onSave={handleSaveAsset}
        editingAsset={editingAsset}
        loading={loading}
      />
      <AssetBottomSheet
        visible={showBottomSheet}
        asset={selectedAsset}
        onClose={handleCloseBottomSheet}
        onEdit={handleEditAsset}
        onPhotosUpdate={userProfile?.role === 'admin' ? handlePhotosUpdate : undefined}
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
    flexWrap: 'wrap',
  },
  sectionHeaderText: {
    flex: 1,
    minWidth: 200,
    marginRight: 12,
    marginBottom: 8,
  },
  addAssetButtonContainer: {
    alignItems: 'flex-end',
    justifyContent: 'flex-start',
    marginBottom: 8,
  },
  addAssetButton: {
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


