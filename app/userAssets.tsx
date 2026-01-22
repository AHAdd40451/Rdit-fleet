import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { LoadingBar } from '../src/components/LoadingBar';
import { useAuth } from '../src/contexts/AuthContext';
import { useToast } from '../src/components/Toast';
import { supabase } from '../lib/supabase';
import { BottomNavBar } from '../src/components/BottomNavBar';
import { AssetBottomSheet } from '../src/components/AssetBottomSheet';
import { AssetModal } from '../src/components/AssetModal';
import { ChecklistModal } from '../src/components/ChecklistModal';
import { TopBar } from '../src/components/TopBar';
import { Sidebar } from '../src/components/Sidebar';
import { UserAssetsSkeleton } from '../src/components/SkeletonScreens';
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
  reminders?: string | null;
}

export default function UserAssetsScreen() {
  const router = useRouter();
  const { userProfile, session } = useAuth();
  const { showToast } = useToast();
  
  const [userAssets, setUserAssets] = useState<Asset[]>([]);
  const [loadingUserAssets, setLoadingUserAssets] = useState(true);
  const [showBottomSheet, setShowBottomSheet] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [showAssetModal, setShowAssetModal] = useState(false);
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);
  const [loading, setLoading] = useState(false);
  const [showChecklistModal, setShowChecklistModal] = useState(false);
  const [checklistAsset, setChecklistAsset] = useState<Asset | null>(null);
  const [savingChecklist, setSavingChecklist] = useState(false);

  // Fetch user assets
  useEffect(() => {
    const fetchUserAssets = async () => {
      if (userProfile?.role !== 'user') {
        setLoadingUserAssets(false);
        return;
      }

      try {
        setLoadingUserAssets(true);
        
        // Get the userId (admin who created this user)
        let filterUserId: string | undefined;
        
        if (userProfile.userId) {
          filterUserId = userProfile.userId;
        } else if (userProfile.id) {
          const { data: fullUserProfile } = await supabase
            .from('users')
            .select('userId')
            .eq('id', userProfile.id)
            .single();
          
          if (fullUserProfile?.userId) {
            filterUserId = fullUserProfile.userId;
          }
        } else if (userProfile.email) {
          const { data: fullUserProfile } = await supabase
            .from('users')
            .select('userId')
            .eq('email', userProfile.email)
            .single();
          
          if (fullUserProfile?.userId) {
            filterUserId = fullUserProfile.userId;
          }
        } else if (userProfile.phone_no) {
          const { data: fullUserProfile } = await supabase
            .from('users')
            .select('userId')
            .eq('phone_no', userProfile.phone_no)
            .single();
          
          if (fullUserProfile?.userId) {
            filterUserId = fullUserProfile.userId;
          }
        }
        
        if (!filterUserId) {
          setUserAssets([]);
          setLoadingUserAssets(false);
          return;
        }

        // Fetch assets assigned to this user's admin
        const { data, error: fetchError } = await supabase
          .from('assets')
          .select('*')
          .eq('user_id', filterUserId)
          .order('created_at', { ascending: false });

        if (fetchError) {
          throw fetchError;
        }

        setUserAssets(data || []);
      } catch (err: any) {
        console.error('Error fetching user assets:', err);
        showToast(err.message || 'Failed to fetch assets', 'error');
      } finally {
        setLoadingUserAssets(false);
      }
    };

    fetchUserAssets();
  }, [userProfile, session]);

  const handleSnapPhoto = async (asset: Asset) => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Camera permission is required to take photos.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 0.8,
      });

      if (result.canceled || !result.assets || result.assets.length === 0) {
        return;
      }

      // Open the asset bottom sheet to show/upload the photo
      setSelectedAsset(asset);
      setShowBottomSheet(true);
      showToast('Photo captured! You can view it in the asset details.', 'success');
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'Failed to take photo. Please try again.');
    }
  };

  const handleChecklist = (asset: Asset) => {
    setChecklistAsset(asset);
    setShowChecklistModal(true);
  };

  const handleCloseBottomSheet = () => {
    setShowBottomSheet(false);
    setSelectedAsset(null);
  };

  const handleEditAsset = (asset: Asset) => {
    // Open edit modal when row is clicked
    setEditingAsset(asset);
    setShowAssetModal(true);
  };

  const handleSaveAsset = async (assetData: Omit<Asset, 'id' | 'user_id' | 'photo'>) => {
    setLoading(true);

    try {
      if (!editingAsset || !editingAsset.id) {
        throw new Error('No asset selected for editing.');
      }

      // Get current user ID
      let currentUserId = session?.user?.id;
      
      if (!currentUserId) {
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        currentUserId = currentSession?.user?.id;
      }
      
      if (!currentUserId && userProfile) {
        if (!userProfile.email) {
          const identifier = userProfile.phone_no || `user_${userProfile.id}`;
          currentUserId = generateUUIDFromString(identifier);
        } else {
          try {
            const { data: { user: authUser } } = await supabase.auth.getUser();
            if (authUser && authUser.email === userProfile.email) {
              currentUserId = authUser.id;
            }
          } catch (getUserError) {
            console.log('User not signed in');
          }
        }
      }
      
      if (!currentUserId) {
        throw new Error('Unable to identify current user. Please log in again.');
      }

      // Fetch current asset for logging
      const { data: currentAsset, error: fetchError } = await supabase
        .from('assets')
        .select('*')
        .eq('id', editingAsset.id)
        .single();

      if (fetchError) {
        throw new Error('Failed to fetch current asset data.');
      }

      // Update the asset
      const { error: updateError } = await supabase
        .from('assets')
        .update(assetData)
        .eq('id', editingAsset.id);

      if (updateError) {
        throw new Error(updateError.message || 'Failed to update asset.');
      }

      // Create log entry for asset update
      try {
        const oldValues: any = {};
        const newValues: any = {};
        const changes: any = {};

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

        if (Object.keys(changes).length > 0) {
          const logEntry = {
            asset_id: editingAsset.id,
            user_id: currentUserId,
            action: 'updated',
            user_role: 'user',
            changes: changes,
            old_values: oldValues,
            new_values: newValues,
            description: `User updated asset "${assetData.asset_name || editingAsset.asset_name}"`,
          };

          await supabase.from('asset_logs').insert([logEntry]);
        }
      } catch (logErr) {
        console.error('Error in log creation:', logErr);
      }

      // Call rapid-function if mileage > 5000
      if (assetData.mileage && assetData.mileage > 5000) {
        try {
          await callRapidFunction({
            asset_id: editingAsset.id,
            asset_name: assetData.asset_name || editingAsset.asset_name,
            mileage: assetData.mileage,
            user_id: currentUserId,
            user_email: userProfile?.email,
          });
        } catch (rapidFunctionError) {
          console.error('Error calling rapid-function:', rapidFunctionError);
        }
      }

      showToast('Asset updated successfully!', 'success', 2000);
      
      // Close modal and refresh assets
      setShowAssetModal(false);
      setEditingAsset(null);
      
      // Refresh assets list - get the admin's userId (filterUserId)
      let filterUserId: string | undefined;
      if (userProfile?.userId) {
        filterUserId = userProfile.userId;
      } else if (userProfile?.id) {
        const { data: fullUserProfile } = await supabase
          .from('users')
          .select('userId')
          .eq('id', userProfile.id)
          .single();
        if (fullUserProfile?.userId) {
          filterUserId = fullUserProfile.userId;
        }
      }
      
      if (filterUserId) {
        const { data, error: fetchError2 } = await supabase
          .from('assets')
          .select('*')
          .eq('user_id', filterUserId)
          .order('created_at', { ascending: false });

        if (!fetchError2 && data) {
          setUserAssets(data);
        }
      }
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

  const handleCloseModal = () => {
    if (!loading) {
      setShowAssetModal(false);
      setEditingAsset(null);
    }
  };

  const handleCloseChecklistModal = () => {
    if (!savingChecklist) {
      setShowChecklistModal(false);
      setChecklistAsset(null);
    }
  };

  const handleSaveChecklist = async (reminders: string) => {
    if (!checklistAsset?.id) return;

    try {
      setSavingChecklist(true);

      // Update the asset with new reminders
      const { error: updateError } = await supabase
        .from('assets')
        .update({ reminders })
        .eq('id', checklistAsset.id);

      if (updateError) {
        throw new Error(updateError.message || 'Failed to update checklist.');
      }

      // Update local state
      const updatedAssets = userAssets.map((asset) =>
        asset.id === checklistAsset.id
          ? { ...asset, reminders }
          : asset
      );
      setUserAssets(updatedAssets);

      showToast('Checklist updated successfully!', 'success', 2000);
      setShowChecklistModal(false);
      setChecklistAsset(null);
    } catch (error: any) {
      console.error('Save checklist error:', error);
      showToast(
        error.message || 'An error occurred. Please try again.',
        'error'
      );
    } finally {
      setSavingChecklist(false);
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const getAssetIcon = (assetName: string) => {
    const name = assetName.toLowerCase();
    if (name.includes('truck')) {
      return 'car-outline';
    } else if (name.includes('trailer')) {
      return 'cube-outline';
    }
    return 'car-outline';
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <TopBar
        title="Assets"
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
        {/* Greeting Section */}
        <View style={styles.userGreetingSection}>
          <Text style={styles.userGreeting}>
            {getGreeting()}, {userProfile?.first_name || 'Crew'}!
          </Text>
        </View>

        {/* Vehicles Assigned Section */}
        <View style={styles.userAssetsContainer}>
          <View style={styles.userAssetsHeader}>
            <Text style={styles.userAssetsTitle}>
              Vehicles Assigned to You ({userAssets.length})
            </Text>
          </View>

          {loadingUserAssets ? (
            <View style={styles.userLoadingContainer}>
              <LoadingBar variant="spinner" />
              <Text style={styles.userLoadingText}>Loading vehicles...</Text>
            </View>
          ) : userAssets.length === 0 ? (
            <View style={styles.userEmptyContainer}>
              <Text style={styles.userEmptyText}>No vehicles assigned to you yet.</Text>
            </View>
          ) : (
            <View style={styles.userAssetsList}>
              {userAssets.map((asset, index) => (
                <View key={asset.id}>
                  <View style={styles.userAssetRow}>
                    {/* Icon and Name Row - Clickable */}
                    <TouchableOpacity
                      style={styles.userAssetHeaderRow}
                      onPress={() => handleEditAsset(asset)}
                      activeOpacity={0.7}
                    >
                      <View style={styles.userAssetIconContainer}>
                        <Ionicons
                          name={getAssetIcon(asset.asset_name)}
                          size={24}
                          color="#999"
                        />
                      </View>
                      <Text style={styles.userAssetName}>{asset.asset_name}</Text>
                    </TouchableOpacity>
                    
                    {/* Buttons Row */}
                    <View style={styles.userAssetActions}>
                      <TouchableOpacity
                        onPress={() => handleSnapPhoto(asset)}
                        activeOpacity={0.8}
                        style={styles.actionButtonWrapper}
                      >
                        <LinearGradient
                          colors={[TEAL_GREEN, BRIGHT_GREEN]}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 0 }}
                          style={styles.userActionButton}
                        >
                          <Ionicons name="camera-outline" size={18} color="#fff" style={styles.buttonIcon} />
                          <Text style={styles.userActionButtonText}>Snap a Photo</Text>
                        </LinearGradient>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => handleChecklist(asset)}
                        activeOpacity={0.8}
                        style={styles.actionButtonWrapper}
                      >
                        <LinearGradient
                          colors={[TEAL_GREEN, BRIGHT_GREEN]}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 0 }}
                          style={styles.userActionButton}
                        >
                          <Text style={styles.userActionButtonText}>Checklist</Text>
                          <Ionicons name="chevron-forward" size={18} color="#fff" style={styles.buttonIcon} />
                        </LinearGradient>
                      </TouchableOpacity>
                    </View>
                  </View>
                  {index < userAssets.length - 1 && <View style={styles.userAssetDivider} />}
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
      <BottomNavBar />
      <Sidebar visible={sidebarVisible} onClose={() => setSidebarVisible(false)} />
      <AssetBottomSheet
        visible={showBottomSheet}
        asset={selectedAsset}
        onClose={handleCloseBottomSheet}
        onEdit={handleEditAsset}
      />
      <AssetModal
        visible={showAssetModal}
        onClose={handleCloseModal}
        onSave={handleSaveAsset}
        editingAsset={editingAsset}
        loading={loading}
      />
      <ChecklistModal
        visible={showChecklistModal}
        onClose={handleCloseChecklistModal}
        onSave={handleSaveChecklist}
        asset={checklistAsset}
        loading={savingChecklist}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContent: {
    paddingBottom: 100,
  },
  userGreetingSection: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 16,
  },
  userGreeting: {
    fontSize: 24,
    fontWeight: '600',
    color: '#333',
  },
  userAssetsContainer: {
    marginHorizontal: 20,
    marginBottom: 20,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    overflow: 'hidden',
  },
  userAssetsHeader: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  userAssetsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  userAssetsList: {
    paddingVertical: 8,
  },
  userAssetRow: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#fff',
  },
  userAssetHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    flex: 1,
  },
  userAssetIconContainer: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  userAssetName: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  userAssetActions: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
  },
  actionButtonWrapper: {
    flex: 1,
  },
  userActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    minHeight: 44,
    // Shadow for iOS
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    // Shadow for Android
    elevation: 3,
  },
  userActionButtonText: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '600',
  },
  buttonIcon: {
    marginHorizontal: 6,
  },
  userAssetDivider: {
    height: 1,
    backgroundColor: '#E0E0E0',
    marginLeft: 16,
    marginRight: 16,
  },
  userLoadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  userLoadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#666',
  },
  userEmptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  userEmptyText: {
    fontSize: 14,
    color: '#666',
  },
});
