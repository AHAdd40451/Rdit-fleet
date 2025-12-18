import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableWithoutFeedback,
  Image,
  Alert,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Button } from './Button';
import { Input } from './Input';
import { LoadingBar } from './LoadingBar';

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

interface AssetModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (assetData: Omit<Asset, 'id' | 'user_id' | 'photo'>) => Promise<void>;
  editingAsset?: Asset | null;
  loading?: boolean;
}

export const AssetModal: React.FC<AssetModalProps> = ({
  visible,
  onClose,
  onSave,
  editingAsset,
  loading = false,
}) => {
  const [assetName, setAssetName] = useState('');
  const [color, setColor] = useState('');
  const [vin, setVin] = useState('');
  const [make, setMake] = useState('');
  const [model, setModel] = useState('');
  const [year, setYear] = useState('');
  const [odometer, setOdometer] = useState('');
  const [mileage, setMileage] = useState('');
  const [photoUri, setPhotoUri] = useState<string | null>(null);

  useEffect(() => {
    if (editingAsset) {
      setAssetName(editingAsset.asset_name || '');
      setColor(editingAsset.color || '');
      setVin(editingAsset.vin || '');
      setMake(editingAsset.make || '');
      setModel(editingAsset.model || '');
      setYear(editingAsset.year?.toString() || '');
      setOdometer(editingAsset.odometer?.toString() || '');
      setMileage(editingAsset.mileage?.toString() || '');
      // Photo is not loaded from database, always start fresh
      setPhotoUri(null);
    } else {
      // Reset form for new asset
      setAssetName('');
      setColor('');
      setVin('');
      setMake('');
      setModel('');
      setYear('');
      setOdometer('');
      setMileage('');
      setPhotoUri(null);
    }
  }, [editingAsset, visible]);

  const handleTakePhoto = async () => {
    try {
      // Request camera permissions
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert(
          'Permission Denied',
          'Camera permission is required to take photos.',
          [{ text: 'OK' }]
        );
        return;
      }

      // Launch camera
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setPhotoUri(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'Failed to take photo. Please try again.');
    }
  };

  const handleRemovePhoto = () => {
    setPhotoUri(null);
  };

  const handleSave = async () => {
    if (!assetName || !vin) {
      return;
    }

    const assetData: Omit<Asset, 'id' | 'user_id' | 'photo'> = {
      asset_name: assetName.trim(),
      color: color.trim() || '',
      vin: vin.trim(),
      make: make.trim() || '',
      model: model.trim() || '',
      year: year ? parseInt(year, 10) : null,
      odometer: odometer ? parseInt(odometer, 10) : null,
      mileage: mileage ? parseInt(mileage, 10) : null,
    };

    await onSave(assetData);
  };

  const handleClose = () => {
    if (!loading) {
      onClose();
    }
  };

  const isFormValid = assetName.trim() && vin.trim();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <TouchableWithoutFeedback onPress={handleClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback onPress={() => {}}>
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
              style={styles.modalContainer}
            >
              <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
              >
                <View style={styles.modalContent}>
                  <View style={styles.header}>
                    <Text style={styles.modalTitle}>
                      {editingAsset ? 'Edit Asset' : 'Create New Asset'}
                    </Text>
                    <TouchableOpacity
                      onPress={handleClose}
                      style={styles.closeButton}
                      disabled={loading}
                    >
                      <Text style={styles.closeButtonText}>✕</Text>
                    </TouchableOpacity>
                  </View>

                  <View style={styles.form}>
                    <View style={styles.inputContainer}>
                      <Input
                        variant="text"
                        label="Asset Name *"
                        value={assetName}
                        onChangeText={setAssetName}
                        style={styles.input}
                        autoCapitalize="words"
                        editable={!loading}
                        placeholder="Enter asset name"
                      />
                      <Input
                        variant="text"
                        label="VIN *"
                        value={vin}
                        onChangeText={setVin}
                        style={styles.input}
                        autoCapitalize="characters"
                        editable={!loading}
                        placeholder="Enter VIN number"
                      />
                      <Input
                        variant="text"
                        label="Make"
                        value={make}
                        onChangeText={setMake}
                        style={styles.input}
                        autoCapitalize="words"
                        editable={!loading}
                        placeholder="Enter make"
                      />
                      <Input
                        variant="text"
                        label="Model"
                        value={model}
                        onChangeText={setModel}
                        style={styles.input}
                        autoCapitalize="words"
                        editable={!loading}
                        placeholder="Enter model"
                      />
                      <Input
                        variant="text"
                        label="Year"
                        value={year}
                        onChangeText={setYear}
                        style={styles.input}
                        keyboardType="numeric"
                        editable={!loading}
                        placeholder="Enter year"
                      />
                      <Input
                        variant="text"
                        label="Color"
                        value={color}
                        onChangeText={setColor}
                        style={styles.input}
                        autoCapitalize="words"
                        editable={!loading}
                        placeholder="Enter color"
                      />
                      <Input
                        variant="text"
                        label="Odometer"
                        value={odometer}
                        onChangeText={setOdometer}
                        style={styles.input}
                        keyboardType="numeric"
                        editable={!loading}
                        placeholder="Enter odometer reading"
                      />
                      <Input
                        variant="text"
                        label="Mileage"
                        value={mileage}
                        onChangeText={setMileage}
                        style={styles.input}
                        keyboardType="numeric"
                        editable={!loading}
                        placeholder="Enter mileage"
                      />
                      
                      {/* Photo Section */}
                      <View style={styles.photoSection}>
                        <Text style={styles.photoLabel}>Photo</Text>
                        {photoUri ? (
                          <View style={styles.photoContainer}>
                            <Image source={{ uri: photoUri }} style={styles.photoPreview} />
                            <View style={styles.photoActions}>
                              <TouchableOpacity
                                onPress={handleTakePhoto}
                                style={styles.photoButton}
                                disabled={loading}
                              >
                                <Text style={styles.photoButtonText}>Retake Photo</Text>
                              </TouchableOpacity>
                              <TouchableOpacity
                                onPress={handleRemovePhoto}
                                style={[styles.photoButton, styles.removeButton]}
                                disabled={loading}
                              >
                                <Text style={styles.photoButtonText}>Remove</Text>
                              </TouchableOpacity>
                            </View>
                          </View>
                        ) : (
                          <TouchableOpacity
                            onPress={handleTakePhoto}
                            style={styles.takePhotoButton}
                            disabled={loading}
                          >
                            <Text style={styles.takePhotoButtonText}>📷 Take Photo</Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    </View>

                    <View style={styles.buttonContainer}>
                      <Button
                        variant="gradient"
                        title={
                          loading
                            ? editingAsset
                              ? 'Updating...'
                              : 'Creating...'
                            : editingAsset
                            ? 'Update Asset'
                            : 'Create Asset'
                        }
                        onPress={handleSave}
                        disabled={loading || !isFormValid}
                        style={styles.saveButton}
                      />
                      {loading && (
                        <View style={styles.loadingContainer}>
                          <LoadingBar variant="bar" />
                        </View>
                      )}
                    </View>
                  </View>
                </View>
              </ScrollView>
            </KeyboardAvoidingView>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    width: '100%',
    maxWidth: 500,
    maxHeight: '90%',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    width: '100%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
  },
  closeButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 16,
    backgroundColor: '#f0f0f0',
  },
  closeButtonText: {
    fontSize: 18,
    color: '#666',
    fontWeight: 'bold',
  },
  form: {
    width: '100%',
  },
  inputContainer: {
    width: '100%',
  },
  input: {
    marginBottom: 16,
  },
  buttonContainer: {
    marginTop: 24,
    alignItems: 'center',
  },
  saveButton: {
    maxWidth: 300,
    marginBottom: 12,
  },
  loadingContainer: {
    marginTop: 8,
    width: '100%',
    maxWidth: 300,
    marginBottom: 12,
  },
  photoSection: {
    marginTop: 8,
    marginBottom: 16,
  },
  photoLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
    marginBottom: 8,
  },
  takePhotoButton: {
    backgroundColor: '#f0f0f0',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderStyle: 'dashed',
  },
  takePhotoButtonText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  photoContainer: {
    width: '100%',
  },
  photoPreview: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginBottom: 12,
    backgroundColor: '#f0f0f0',
  },
  photoActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  photoButton: {
    flex: 1,
    backgroundColor: '#14AB98',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeButton: {
    backgroundColor: '#ff4444',
  },
  photoButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});


