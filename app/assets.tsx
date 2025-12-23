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

  const handleSaveAsset = async (assetData: Omit<Asset, 'id' | 'user_id'>) => {
    setLoading(true);

    try {
      // Only admins can create or update assets
      if (userProfile?.role !== 'admin') {
        throw new Error('You do not have permission to create or update assets.');
      }

      // Assets table uses UUID (from Supabase auth session.user.id)
      // Must use UUID, not numeric userProfile.id
      const currentUserId = session?.user?.id;
      
      if (!currentUserId) {
        throw new Error('Unable to identify current user. Please log in again.');
      }

      if (editingAsset) {
        // Update existing asset - only admins can do this
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

        showToast('Asset updated successfully!', 'success', 2000);
      } else {
        // Create new asset
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
    // Only admins can edit assets
    if (userProfile?.role !== 'admin') {
      showToast('You do not have permission to edit assets.', 'error');
      return;
    }
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
              onEditAsset={userProfile?.role === 'admin' ? handleEditAsset : undefined}
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
        onEdit={userProfile?.role === 'admin' ? handleEditAsset : undefined}
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


