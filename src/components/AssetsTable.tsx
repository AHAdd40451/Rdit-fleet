import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { supabase } from '../../lib/supabase';
import { LoadingBar } from './LoadingBar';
import { useToast } from './Toast';
import { useAuth } from '../contexts/AuthContext';

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
}

interface AssetsTableProps {
  onEditAsset?: (asset: Asset) => void;
}

export const AssetsTable: React.FC<AssetsTableProps> = ({
  onEditAsset,
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

      // Get current admin user ID
      const currentUserId = session?.user?.id || userProfile?.id;
      
      if (!currentUserId) {
        throw new Error('Unable to identify current user. Please log in again.');
      }

      const { data, error: fetchError } = await supabase
        .from('assets')
        .select('*')
        .eq('user_id', currentUserId)
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
        <LoadingBar variant="bar" />
        <Text style={styles.loadingText}>Loading assets...</Text>
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
              <View key={asset.id} style={styles.row}>
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
                  <View style={styles.actionButtons}>
                    <TouchableOpacity
                      onPress={() => handleEdit(asset)}
                      style={[styles.actionButton, styles.editButton]}
                      disabled={deletingAssetId === asset.id}
                    >
                      <Text style={styles.editButtonText}>Edit</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => handleDelete(asset)}
                      style={[styles.actionButton, styles.deleteButton]}
                      disabled={deletingAssetId === asset.id}
                    >
                      <Text style={styles.deleteButtonText}>
                        {deletingAssetId === asset.id ? '...' : 'Delete'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
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
    color: '#666',
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

