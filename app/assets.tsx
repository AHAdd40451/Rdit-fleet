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
import { LoadingBar } from '../src/components/LoadingBar';
import { useAuth } from '../src/contexts/AuthContext';
import { useToast } from '../src/components/Toast';
import { supabase } from '../lib/supabase';
import { BottomNavBar } from '../src/components/BottomNavBar';
import { AssetsTable } from '../src/components/AssetsTable';
import { AssetModal } from '../src/components/AssetModal';

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
}

export default function AssetsScreen() {
  const router = useRouter();
  const { signOut, userProfile, user, session } = useAuth();
  const { showToast } = useToast();
  
  // Modal and asset management state
  const [showAssetModal, setShowAssetModal] = useState(false);
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);
  const [loading, setLoading] = useState(false);
  const [checkingCompany, setCheckingCompany] = useState(true);
  const [refreshAssetsTable, setRefreshAssetsTable] = useState(0);

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

  const handleSaveAsset = async (assetData: Omit<Asset, 'id' | 'user_id'>) => {
    setLoading(true);

    try {
      // Get current admin user ID
      const currentUserId = session?.user?.id || userProfile?.id;
      
      if (!currentUserId) {
        throw new Error('Unable to identify current user. Please log in again.');
      }

      if (editingAsset) {
        // Update existing asset
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

        const { error: insertError } = await supabase
          .from('assets')
          .insert([newAssetData]);

        if (insertError) {
          console.error('Database error:', insertError);
          const errorMessage = insertError.message || 'Failed to create asset.';
          throw new Error(
            `Database error: ${errorMessage}. Please check your table structure.`
          );
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
    setEditingAsset(asset);
    setShowAssetModal(true);
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
              <View style={styles.addAssetButtonContainer}>
                <Button
                  variant="gradient"
                  title="Add Asset"
                  onPress={handleAddAsset}
                  style={styles.addAssetButton}
                />
              </View>
            </View>
            <AssetsTable
              key={refreshAssetsTable}
              onEditAsset={handleEditAsset}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
      <BottomNavBar />
      <AssetModal
        visible={showAssetModal}
        onClose={handleCloseModal}
        onSave={handleSaveAsset}
        editingAsset={editingAsset}
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

