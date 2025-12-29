import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';
import { LoadingBar } from './LoadingBar';
import { useToast } from './Toast';
import { useAuth } from '../contexts/AuthContext';
import { generateUUIDFromString } from '../utils/generateUUID';

interface Asset {
  id: string;
  asset_name: string;
  color: string;
  vin: string;
  make: string;
  model: string;
  year: number;
  odometer: number;
  mileage: number;
  user_id: string;
  created_at: string;
  state?: string | null;
}

interface AssetsTableProps {
  onEditAsset?: (asset: Asset) => void;
  onAssetClick?: (asset: Asset) => void;
}

export const AssetsTable: React.FC<AssetsTableProps> = ({
  onEditAsset,
  onAssetClick,
}) => {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingAssetId, setDeletingAssetId] = useState<string | null>(null);
  const { showToast } = useToast();
  const { session, userProfile } = useAuth();

  const fetchAssets = async () => {
    try {
      setLoading(true);
      setError(null);

      // Determine which user_id to filter by
      let filterUserId: string | undefined;
      
      if (userProfile?.role === 'admin') {
        // Admin users: show assets where user_id matches their session.user.id (their own assets)
        filterUserId = session?.user?.id;
        
        // If no session (phone-based admin without email), generate UUID from phone number or ID
        if (!filterUserId && userProfile) {
          const identifier = userProfile.phone_no || `user_${userProfile.id}`;
          filterUserId = generateUUIDFromString(identifier);
        }
      } else if (userProfile?.role === 'user') {
        // Regular users: show assets where user_id matches their userId (the admin who created them)
        // Check if userId is already in userProfile, otherwise fetch it
        if (userProfile.userId) {
          filterUserId = userProfile.userId;
        } else if (userProfile.id) {
          // Fetch userId from users table
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
      } else {
        // Fallback: use session.user.id if available
        filterUserId = session?.user?.id;
      }
      
      if (!filterUserId) {
        // No user ID found to filter by
        setAssets([]);
        setLoading(false);
        return;
      }

      // Fetch assets matching the filter user_id
      const { data, error: fetchError } = await supabase
        .from('assets')
        .select('*')
        .eq('user_id', filterUserId)
        .order('created_at', { ascending: false });

      if (fetchError) {
        throw fetchError;
      }

      setAssets(data || []);
    } catch (err: any) {
      console.error('Error fetching assets:', err);
      setError(err.message || 'Failed to fetch assets');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssets();
  }, [session, userProfile]);

  const handleDelete = (asset: Asset) => {
    Alert.alert(
      'Delete Asset',
      `Are you sure you want to delete ${asset.asset_name}? This action cannot be undone.`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setDeletingAssetId(asset.id);
              const { error: deleteError } = await supabase
                .from('assets')
                .delete()
                .eq('id', asset.id);

              if (deleteError) {
                throw deleteError;
              }

              showToast('Asset deleted successfully!', 'success', 2000);
              await fetchAssets();
            } catch (err: any) {
              console.error('Error deleting asset:', err);
              showToast(
                err.message || 'Failed to delete asset. Please try again.',
                'error'
              );
            } finally {
              setDeletingAssetId(null);
            }
          },
        },
      ]
    );
  };

  const handleEdit = (asset: Asset) => {
    if (onEditAsset) {
      onEditAsset(asset);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <LoadingBar variant="spinner" />
        <Text style={styles.loadingText}>Loading asset</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity onPress={fetchAssets} style={styles.retryButton}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (assets.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No assets found</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={true}
        contentContainerStyle={styles.horizontalScrollContent}
      >
        <View style={styles.tableWrapper}>
          <View style={styles.headerRow}>
            <Text style={[styles.headerCell, styles.nameHeader]}>Asset Name</Text>
            <Text style={[styles.headerCell, styles.vinHeader]}>VIN</Text>
            <Text style={[styles.headerCell, styles.makeHeader]}>Make</Text>
            <Text style={[styles.headerCell, styles.modelHeader]}>Model</Text>
            <Text style={[styles.headerCell, styles.yearHeader]}>Year</Text>
            <Text style={[styles.headerCell, styles.colorHeader]}>Color</Text>
            <Text style={[styles.headerCell, styles.odometerHeader]}>Odometer</Text>
            <Text style={[styles.headerCell, styles.mileageHeader]}>Mileage</Text>
            <Text style={[styles.headerCell, styles.actionsHeader]}>Actions</Text>
          </View>
          <ScrollView
            style={styles.scrollView}
            showsVerticalScrollIndicator={true}
            nestedScrollEnabled={true}
          >
            {assets.map((asset) => (
              <TouchableOpacity
                key={asset.id}
                style={styles.row}
                onPress={() => onAssetClick && onAssetClick(asset)}
                activeOpacity={0.7}
              >
                <View style={[styles.cell, styles.nameCell]}>
                  <Text style={styles.cellText} numberOfLines={1}>
                    {asset.asset_name || 'N/A'}
                  </Text>
                </View>
                <View style={[styles.cell, styles.vinCell]}>
                  <Text style={styles.cellText} numberOfLines={1}>
                    {asset.vin || 'N/A'}
                  </Text>
                </View>
                <View style={[styles.cell, styles.makeCell]}>
                  <Text style={styles.cellText} numberOfLines={1}>
                    {asset.make || 'N/A'}
                  </Text>
                </View>
                <View style={[styles.cell, styles.modelCell]}>
                  <Text style={styles.cellText} numberOfLines={1}>
                    {asset.model || 'N/A'}
                  </Text>
                </View>
                <View style={[styles.cell, styles.yearCell]}>
                  <Text style={styles.cellText}>
                    {asset.year || 'N/A'}
                  </Text>
                </View>
                <View style={[styles.cell, styles.colorCell]}>
                  <Text style={styles.cellText} numberOfLines={1}>
                    {asset.color || 'N/A'}
                  </Text>
                </View>
                <View style={[styles.cell, styles.odometerCell]}>
                  <Text style={styles.cellText}>
                    {asset.odometer?.toLocaleString() || 'N/A'}
                  </Text>
                </View>
                <View style={[styles.cell, styles.mileageCell]}>
                  <Text style={styles.cellText}>
                    {asset.mileage?.toLocaleString() || 'N/A'}
                  </Text>
                </View>
                <View style={[styles.cell, styles.actionsCell]}>
                  {userProfile?.role === 'admin' && (
                    <View style={styles.actionButtons}>
                      <TouchableOpacity
                        onPress={(e) => {
                          e.stopPropagation();
                          handleEdit(asset);
                        }}
                        style={[styles.actionButton, styles.editButton]}
                        disabled={deletingAssetId === asset.id}
                      >
                        <Text style={styles.editButtonText}>Edit</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={(e) => {
                          e.stopPropagation();
                          handleDelete(asset);
                        }}
                        style={[styles.actionButton, styles.deleteButton]}
                        disabled={deletingAssetId === asset.id}
                      >
                        <Text style={styles.deleteButtonText}>
                          {deletingAssetId === asset.id ? '...' : 'Delete'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  )}
                  {userProfile?.role !== 'admin' && (
                    <View style={styles.viewOnlyContainer}>
                      <Ionicons name="eye-outline" size={20} color="#999" />
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    overflow: 'hidden',
  },
  horizontalScrollContent: {
    flexGrow: 1,
  },
  tableWrapper: {
    minWidth: 1000,
  },
  headerRow: {
    flexDirection: 'row',
    backgroundColor: '#f9f9f9',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 2,
    borderBottomColor: '#E0E0E0',
  },
  headerCell: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#000',
  },
  nameHeader: {
    width: 120,
  },
  vinHeader: {
    width: 150,
  },
  makeHeader: {
    width: 100,
  },
  modelHeader: {
    width: 120,
  },
  yearHeader: {
    width: 70,
    textAlign: 'center',
  },
  colorHeader: {
    width: 100,
  },
  odometerHeader: {
    width: 100,
    textAlign: 'center',
  },
  mileageHeader: {
    width: 100,
    textAlign: 'center',
  },
  actionsHeader: {
    width: 200,
    textAlign: 'center',
  },
  viewOnlyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollView: {
    maxHeight: 400,
  },
  row: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  cell: {
    justifyContent: 'center',
  },
  cellText: {
    fontSize: 14,
    color: '#333',
  },
  nameCell: {
    width: 120,
  },
  vinCell: {
    width: 150,
  },
  makeCell: {
    width: 100,
  },
  modelCell: {
    width: 120,
  },
  yearCell: {
    width: 70,
    alignItems: 'center',
  },
  colorCell: {
    width: 100,
  },
  odometerCell: {
    width: 100,
    alignItems: 'center',
  },
  mileageCell: {
    width: 100,
    alignItems: 'center',
  },
  actionsCell: {
    width: 200,
    alignItems: 'center',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionButton: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
    minWidth: 55,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  editButton: {
    backgroundColor: '#14AB98',
  },
  deleteButton: {
    backgroundColor: '#F44336',
  },
  editButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  deleteButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#14AB98',
  },
  errorContainer: {
    padding: 20,
    alignItems: 'center',
  },
  errorText: {
    fontSize: 14,
    color: '#D32F2F',
    marginBottom: 12,
    textAlign: 'center',
  },
  retryButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#14AB98',
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyContainer: {
    padding: 20,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#666',
  },
});


