import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Animated,
  Dimensions,
  SafeAreaView,
  Image,
  Alert,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const BOTTOM_SHEET_HEIGHT = SCREEN_HEIGHT * 0.8;

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
  created_at?: string;
  photo?: string | null;
  photos?: string[] | null;
  state?: string | null;
}

interface AssetBottomSheetProps {
  visible: boolean;
  asset: Asset | null;
  onClose: () => void;
  onEdit?: (asset: Asset) => void;
  onPhotosUpdate?: (assetId: string, photos: string[]) => Promise<void>;
}

export const AssetBottomSheet: React.FC<AssetBottomSheetProps> = ({
  visible,
  asset,
  onClose,
  onEdit,
  onPhotosUpdate,
}) => {
  const slideAnim = React.useRef(new Animated.Value(BOTTOM_SHEET_HEIGHT)).current;
  const { session } = useAuth();
  const [photos, setPhotos] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null);

  // Initialize photos from asset
  useEffect(() => {
    if (asset) {
      // Support both old single photo and new photos array
      const assetPhotos: string[] = [];
      
      // Handle photos array (could be array or JSON string)
      if (asset.photos) {
        if (Array.isArray(asset.photos)) {
          assetPhotos.push(...asset.photos.filter((p): p is string => typeof p === 'string' && p.length > 0));
        } else if (typeof asset.photos === 'string') {
          try {
            const parsed = JSON.parse(asset.photos);
            if (Array.isArray(parsed)) {
              assetPhotos.push(...parsed.filter((p): p is string => typeof p === 'string' && p.length > 0));
            }
          } catch {
            // If parsing fails, treat as single photo URL
            if (asset.photos.length > 0) {
              assetPhotos.push(asset.photos);
            }
          }
        }
      }
      
      // Fallback to single photo field for backward compatibility
      if (assetPhotos.length === 0 && asset.photo) {
        assetPhotos.push(asset.photo);
      }
      
      setPhotos(assetPhotos);
    } else {
      setPhotos([]);
    }
  }, [asset]);

  React.useEffect(() => {
    if (visible) {
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 65,
        friction: 11,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: BOTTOM_SHEET_HEIGHT,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [visible, slideAnim]);

  const uploadAssetImage = async (uri: string, index?: number): Promise<string> => {
    try {
      if (!asset?.id) throw new Error('Asset ID not found');

      const fileExt = uri.split('.').pop()?.toLowerCase() || 'jpg';
      const fileName = `${asset.id}-${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `assets/${fileName}`;

      const contentTypeMap: { [key: string]: string } = {
        jpg: 'image/jpeg',
        jpeg: 'image/jpeg',
        png: 'image/png',
        gif: 'image/gif',
        webp: 'image/webp',
      };
      const contentType = contentTypeMap[fileExt] || 'image/jpeg';

      const base64 = await FileSystem.readAsStringAsync(uri, {
        encoding: 'base64',
      });

      const binaryString = atob(base64);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      const arrayBuffer = bytes.buffer;

      const { error, data: uploadData } = await supabase.storage
        .from('redi-fleet')
        .upload(filePath, arrayBuffer, {
          contentType: contentType,
          upsert: false,
          cacheControl: '3600',
        });

      if (error) {
        console.error('Supabase upload error:', error);
        throw error;
      }

      const { data: urlData } = supabase.storage
        .from('redi-fleet')
        .getPublicUrl(filePath);

      return urlData.publicUrl;
    } catch (err: any) {
      console.error('Upload error:', err);
      throw err;
    }
  };

  const handleAddImages = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission required', 'Allow photo access to upload images');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        quality: 0.8,
        allowsEditing: false,
      });

      if (result.canceled || !result.assets || result.assets.length === 0) {
        return;
      }

      setUploading(true);
      const newPhotoUrls: string[] = [];

      for (let i = 0; i < result.assets.length; i++) {
        const asset = result.assets[i];
        if (!asset?.uri) {
          console.warn(`Skipping asset ${i + 1}: missing URI`);
          continue;
        }
        setUploadingIndex(i);
        try {
          const publicUrl = await uploadAssetImage(asset.uri, i);
          newPhotoUrls.push(publicUrl);
        } catch (error) {
          console.error(`Failed to upload image ${i + 1}:`, error);
          Alert.alert('Upload Error', `Failed to upload image ${i + 1}. Please try again.`);
        }
      }

      const updatedPhotos = [...photos, ...newPhotoUrls];
      setPhotos(updatedPhotos);

      // Save to database
      if (asset?.id && onPhotosUpdate) {
        await onPhotosUpdate(asset.id, updatedPhotos);
      }

      Alert.alert('Success', `${newPhotoUrls.length} image(s) uploaded successfully`);
    } catch (error) {
      console.error('Error adding images:', error);
      Alert.alert('Error', 'Failed to add images. Please try again.');
    } finally {
      setUploading(false);
      setUploadingIndex(null);
    }
  };

  const handleTakePhoto = async () => {
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

      if (result.canceled || !result.assets || result.assets.length === 0 || !result.assets[0]?.uri) {
        return;
      }

      setUploading(true);
      setUploadingIndex(0);
      try {
        const publicUrl = await uploadAssetImage(result.assets[0].uri);
        const updatedPhotos = [...photos, publicUrl];
        setPhotos(updatedPhotos);

        // Save to database
        if (asset?.id && onPhotosUpdate) {
          await onPhotosUpdate(asset.id, updatedPhotos);
        }

        Alert.alert('Success', 'Photo uploaded successfully');
      } catch (error) {
        console.error('Error uploading photo:', error);
        Alert.alert('Error', 'Failed to upload photo. Please try again.');
      } finally {
        setUploading(false);
        setUploadingIndex(null);
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'Failed to take photo. Please try again.');
    }
  };

  const handleRemovePhoto = async (index: number) => {
    Alert.alert(
      'Remove Photo',
      'Are you sure you want to remove this photo?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            const updatedPhotos = photos.filter((_, i) => i !== index);
            setPhotos(updatedPhotos);

            // Save to database
            if (asset?.id && onPhotosUpdate) {
              await onPhotosUpdate(asset.id, updatedPhotos);
            }
          },
        },
      ]
    );
  };

  if (!asset) {
    return null;
  }

  const vehicleName = asset.asset_name || 'N/A';
  const vehicleInfo = `${asset.year || ''} ${asset.make || ''} ${asset.model || ''}`.trim() || 'N/A';

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={onClose}
        />
        <Animated.View
          style={[
            styles.bottomSheet,
            {
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <SafeAreaView style={styles.safeArea}>
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.headerContent}>
                <View style={styles.headerTextContainer}>
                  <Text style={styles.vehicleName}>{vehicleName}</Text>
                  <Text style={styles.vehicleInfo}>{vehicleInfo}</Text>
                </View>
                <TouchableOpacity
                  onPress={onClose}
                  style={styles.closeButton}
                >
                  <Ionicons name="close" size={24} color="#666" />
                </TouchableOpacity>
              </View>
            </View>

            {/* Content */}
            <ScrollView
              style={styles.content}
              contentContainerStyle={styles.contentContainer}
              showsVerticalScrollIndicator={false}
            >
              {/* Image Gallery Section */}
              <View style={styles.imageSection}>
                <View style={styles.imageSectionHeader}>
                  <Text style={styles.imageSectionTitle}>Photos</Text>
                  <View style={styles.imageActionButtons}>
                    <TouchableOpacity
                      onPress={handleTakePhoto}
                      style={styles.imageActionButton}
                      disabled={uploading}
                    >
                      <Ionicons name="camera-outline" size={18} color="#14AB98" />
                      <Text style={styles.imageActionButtonText}>Camera</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={handleAddImages}
                      style={styles.imageActionButton}
                      disabled={uploading}
                    >
                      <Ionicons name="images-outline" size={18} color="#14AB98" />
                      <Text style={styles.imageActionButtonText}>Add Photos</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {uploading && (
                  <View style={styles.uploadingContainer}>
                    <ActivityIndicator size="small" color="#14AB98" />
                    <Text style={styles.uploadingText}>
                      {uploadingIndex !== null
                        ? `Uploading image ${uploadingIndex + 1}...`
                        : 'Uploading...'}
                    </Text>
                  </View>
                )}

                {photos.length > 0 ? (
                  <FlatList
                    data={photos}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    keyExtractor={(item, index) => `${item}-${index}`}
                    contentContainerStyle={styles.imageList}
                    renderItem={({ item, index }) => (
                      <View style={styles.imageItem}>
                        <Image source={{ uri: item }} style={styles.imageThumbnail} />
                        <TouchableOpacity
                          style={styles.removeImageButton}
                          onPress={() => handleRemovePhoto(index)}
                        >
                          <Ionicons name="close-circle" size={24} color="#ff4444" />
                        </TouchableOpacity>
                      </View>
                    )}
                  />
                ) : (
                  <View style={styles.emptyImageContainer}>
                    <Ionicons name="images-outline" size={48} color="#ccc" />
                    <Text style={styles.emptyImageText}>No photos yet</Text>
                    <Text style={styles.emptyImageSubtext}>
                      Tap "Add Photos" to upload images
                    </Text>
                  </View>
                )}
              </View>

              {/* Top Row - Mileage and Odometer */}
              <View style={styles.cardRow}>
                <View style={styles.card}>
                  <View style={styles.cardContent}>
                    <Ionicons name="speedometer-outline" size={24} color="#666" style={styles.cardIcon} />
                    <View style={styles.cardTextContainer}>
                      <Text style={styles.cardValue}>
                        {asset.mileage ? `${asset.mileage.toLocaleString()} mi` : 'N/A'}
                      </Text>
                      <Text style={styles.cardLabel}>Mileage</Text>
                    </View>
                  </View>
                </View>

                <View style={styles.card}>
                  <View style={styles.cardContent}>
                    <Ionicons name="analytics-outline" size={24} color="#666" style={styles.cardIcon} />
                    <View style={styles.cardTextContainer}>
                      <Text style={styles.cardValue}>
                        {asset.odometer ? `${asset.odometer.toLocaleString()} mi` : 'N/A'}
                      </Text>
                      <Text style={styles.cardLabel}>Odometer</Text>
                    </View>
                  </View>
                </View>
              </View>

              {/* Second Row - VIN and Color */}
              <View style={styles.cardRow}>
                <View style={styles.card}>
                  <View style={styles.cardContent}>
                    <Ionicons name="barcode-outline" size={24} color="#666" style={styles.cardIcon} />
                    <View style={styles.cardTextContainer}>
                      <Text style={styles.cardValue} numberOfLines={1}>
                        {asset.vin || 'N/A'}
                      </Text>
                      <Text style={styles.cardLabel}>VIN Number</Text>
                    </View>
                  </View>
                </View>

                <View style={styles.card}>
                  <View style={styles.cardContent}>
                    <Ionicons name="color-palette-outline" size={24} color="#666" style={styles.cardIcon} />
                    <View style={styles.cardTextContainer}>
                      <Text style={styles.cardValue}>
                        {asset.color || 'N/A'}
                      </Text>
                      <Text style={styles.cardLabel}>Color</Text>
                    </View>
                  </View>
                </View>
              </View>

              {/* Third Row - Make and Model */}
              <View style={styles.cardRow}>
                <View style={styles.card}>
                  <View style={styles.cardContent}>
                    <Ionicons name="car-outline" size={24} color="#666" style={styles.cardIcon} />
                    <View style={styles.cardTextContainer}>
                      <Text style={styles.cardValue}>
                        {asset.make || 'N/A'}
                      </Text>
                      <Text style={styles.cardLabel}>Make</Text>
                    </View>
                  </View>
                </View>

                <View style={styles.card}>
                  <View style={styles.cardContent}>
                    <Ionicons name="car-sport-outline" size={24} color="#666" style={styles.cardIcon} />
                    <View style={styles.cardTextContainer}>
                      <Text style={styles.cardValue}>
                        {asset.model || 'N/A'}
                      </Text>
                      <Text style={styles.cardLabel}>Model</Text>
                    </View>
                  </View>
                </View>
              </View>

              {/* Maintenance Card */}
              <View style={styles.fullWidthCard}>
                <View style={styles.cardContent}>
                  <Ionicons name="construct-outline" size={24} color="#666" style={styles.cardIcon} />
                  <View style={styles.cardTextContainer}>
                    <Text style={styles.cardValue}>Maintenance</Text>
                    <Text style={[styles.cardLabel, styles.statusText]}>No Issues Reported</Text>
                  </View>
                  <Ionicons name="chevron-down" size={20} color="#999" />
                </View>
              </View>

              {/* Inspection Card */}
              <View style={styles.fullWidthCard}>
                <View style={styles.cardContent}>
                  <Ionicons name="checkmark-circle" size={24} color="#4CAF50" style={styles.cardIcon} />
                  <View style={styles.cardTextContainer}>
                    <Text style={styles.cardValue}>Inspection</Text>
                    <Text style={[styles.cardLabel, styles.statusText]}>Completed</Text>
                  </View>
                  <Ionicons name="chevron-down" size={20} color="#999" />
                </View>
              </View>
            </ScrollView>

            {/* Footer Actions */}
            {onEdit && (
              <View style={styles.footer}>
                <TouchableOpacity
                  onPress={() => {
                    onEdit(asset);
                    onClose();
                  }}
                  style={styles.editButton}
                >
                  <Ionicons name="create-outline" size={20} color="#fff" />
                  <Text style={styles.editButtonText}>Edit Asset</Text>
                </TouchableOpacity>
              </View>
            )}
          </SafeAreaView>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  backdrop: {
    flex: 1,
  },
  bottomSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: BOTTOM_SHEET_HEIGHT,
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -3,
    },
    shadowOpacity: 0.27,
    shadowRadius: 4.65,
    elevation: 6,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTextContainer: {
    flex: 1,
  },
  vehicleName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  vehicleInfo: {
    fontSize: 16,
    color: '#666',
    fontWeight: '400',
  },
  closeButton: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 18,
    backgroundColor: '#f0f0f0',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 100,
  },
  cardRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  card: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  fullWidthCard: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardIcon: {
    marginRight: 12,
  },
  cardTextContainer: {
    flex: 1,
  },
  cardValue: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  cardLabel: {
    fontSize: 13,
    color: '#666',
    fontWeight: '400',
  },
  statusText: {
    color: '#4CAF50',
    fontWeight: '500',
  },
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    backgroundColor: '#fff',
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#14AB98',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 8,
    gap: 8,
  },
  editButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  imageSection: {
    marginBottom: 20,
  },
  imageSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  imageSectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  imageActionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  imageActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#f0f0f0',
  },
  imageActionButtonText: {
    fontSize: 13,
    color: '#14AB98',
    fontWeight: '500',
  },
  uploadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    marginBottom: 8,
  },
  uploadingText: {
    fontSize: 14,
    color: '#666',
  },
  imageList: {
    paddingVertical: 4,
  },
  imageItem: {
    position: 'relative',
    marginRight: 12,
  },
  imageThumbnail: {
    width: 120,
    height: 120,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
  },
  removeImageButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#fff',
    borderRadius: 12,
  },
  emptyImageContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
    paddingHorizontal: 20,
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderStyle: 'dashed',
  },
  emptyImageText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#666',
    marginTop: 12,
  },
  emptyImageSubtext: {
    fontSize: 13,
    color: '#999',
    marginTop: 4,
  },
});
