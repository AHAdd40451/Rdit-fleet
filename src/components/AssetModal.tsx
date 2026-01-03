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
  ActivityIndicator,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Button } from './Button';
import { Input } from './Input';
import { LoadingBar } from './LoadingBar';
import { extractMileageFromOCR } from '../utils/extractMileageFromOCR';
import { extractVinFromOCR } from '../utils/extractVinFromOCR';

// Conditionally import TextRecognition - it requires native code
// Use dynamic import for better compatibility with Expo modules
let getTextFromFrame: ((inputString: string, isBase64?: boolean) => Promise<string[]>) | null = null;
let isLoading = false;
let loadPromise: Promise<typeof getTextFromFrame> | null = null;

const loadTextRecognition = async (): Promise<typeof getTextFromFrame> => {
  // Return cached function if already loaded
  if (getTextFromFrame) {
    return getTextFromFrame;
  }

  // Return existing promise if already loading
  if (loadPromise) {
    return loadPromise;
  }

  // Start loading
  loadPromise = (async () => {
    try {
      // Use dynamic import for ES modules (works better with Expo autolinking)
      const textRecognitionModule = await import('expo-text-recognition');
      
      // Log module structure for debugging
      console.log('expo-text-recognition module loaded:', {
        keys: Object.keys(textRecognitionModule),
        hasDefault: !!textRecognitionModule.default,
        defaultKeys: textRecognitionModule.default ? Object.keys(textRecognitionModule.default) : [],
        getTextFromFrame: typeof textRecognitionModule.getTextFromFrame,
      });
      
      // The package exports getTextFromFrame as a named export
      if (typeof textRecognitionModule.getTextFromFrame === 'function') {
        getTextFromFrame = textRecognitionModule.getTextFromFrame;
        console.log('✅ Found getTextFromFrame as named export');
        return getTextFromFrame;
      } 
      // Check for default export with getTextFromFrame
      else if (textRecognitionModule.default && typeof textRecognitionModule.default.getTextFromFrame === 'function') {
        getTextFromFrame = textRecognitionModule.default.getTextFromFrame;
        console.log('✅ Found getTextFromFrame in default export');
        return getTextFromFrame;
      }
      // Check if default export IS the function
      else if (typeof textRecognitionModule.default === 'function') {
        getTextFromFrame = textRecognitionModule.default;
        console.log('✅ Using default export as function');
        return getTextFromFrame;
      }
      
      // If we get here, the function wasn't found
      console.error('❌ expo-text-recognition module loaded but getTextFromFrame not found. Module structure:', {
        module: textRecognitionModule,
        keys: Object.keys(textRecognitionModule),
      });
      return null;
    } catch (error: any) {
      // Module not available - this is expected in Expo Go or if native module isn't linked
      console.error('❌ expo-text-recognition import failed:', error.message);
      if (error.message?.includes('Cannot find native module')) {
        console.error('   This usually means the native module is not linked. Make sure you:');
        console.error('   1. Created a development build (npx expo run:android)');
        console.error('   2. The app was rebuilt after installing expo-text-recognition');
      }
      return null;
    }
  })();

  return loadPromise;
};

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
  state?: string | null;
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
  const [state, setState] = useState('');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [showStatePicker, setShowStatePicker] = useState(false);
  const [isProcessingOCR, setIsProcessingOCR] = useState(false);
  const [isProcessingOdometerOCR, setIsProcessingOdometerOCR] = useState(false);
  const [isProcessingVinOCR, setIsProcessingVinOCR] = useState(false);
  const [errors, setErrors] = useState<{
    vin?: string;
    mileage?: string;
    odometer?: string;
  }>({});

  const states = ['FL', 'TX', 'CA', 'NY', 'GA'];

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
      setState(editingAsset.state || '');
      // Photo is not loaded from database, always start fresh
      setPhotoUri(null);
      setErrors({});
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
      setState('');
      setPhotoUri(null);
      setErrors({});
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

  const handleCaptureMileageOCR = async () => {
    // Load and check if TextRecognition is available
    const ocrFunction = await loadTextRecognition();
    if (!ocrFunction) {
      Alert.alert(
        'OCR Not Available',
        'Text recognition requires a development build.\n\n' +
        'To use OCR:\n' +
        '1. Run: npx expo run:android (or npx expo run:ios)\n' +
        '2. This creates a development build with native modules\n' +
        '3. OCR will work in the development build\n\n' +
        'Note: OCR does not work in Expo Go.',
        [
          { text: 'OK' },
          {
            text: 'Learn More',
            onPress: () => {
              // You could open a URL here with more info
              console.log('Development build required for OCR');
            },
          },
        ]
      );
      return;
    }

    try {
      // Request camera permissions
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert(
          'Permission Denied',
          'Camera permission is required to capture mileage readings.',
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
        const uri = result.assets[0].uri;
        setIsProcessingOCR(true);

        try {
          // Perform OCR on the image
          // getTextFromFrame expects a file path or base64 string
          const textArray = await ocrFunction!(uri, false);
          
          // Combine all text lines into a single string
          const ocrText = textArray ? textArray.join(' ') : '';
          
          if (ocrText) {
            // Extract mileage from OCR text
            const extractionResult = extractMileageFromOCR(ocrText);
            
            if (extractionResult.mileage !== null) {
              // Set the extracted mileage
              setMileage(extractionResult.mileage.toString());
              
              // Clear any previous mileage errors
              if (errors.mileage) {
                setErrors({ ...errors, mileage: undefined });
              }

              // Show success message with confidence level
              const confidenceMessage = 
                extractionResult.confidence === 'high' 
                  ? 'High confidence' 
                  : extractionResult.confidence === 'medium'
                  ? 'Medium confidence'
                  : 'Low confidence - please verify';

              Alert.alert(
                'Mileage Extracted',
                `Extracted mileage: ${extractionResult.mileage.toLocaleString()}\n\n${confidenceMessage}`,
                [{ text: 'OK' }]
              );
            } else {
              Alert.alert(
                'No Mileage Found',
                'Could not find a mileage reading in the image. Please ensure the odometer/mileage is clearly visible and try again.',
                [{ text: 'OK' }]
              );
            }
          } else {
            Alert.alert(
              'OCR Failed',
              'Could not extract text from the image. Please try again with a clearer image.',
              [{ text: 'OK' }]
            );
          }
        } catch (ocrError: any) {
          console.error('OCR processing error:', ocrError);
          
          // Check if it's the native module error
          if (ocrError?.message?.includes('Cannot find native module') || 
              ocrError?.message?.includes('ExpoTextRecognition') ||
              ocrError?.message?.includes('getTextFromFrame')) {
            Alert.alert(
              'OCR Not Available',
              'Text recognition requires a development build.\n\n' +
              'Run: npx expo run:android (or npx expo run:ios)\n\n' +
              'OCR does not work in Expo Go.',
              [{ text: 'OK' }]
            );
          } else {
            Alert.alert(
              'Processing Error',
              'Failed to process the image. Please try again.',
              [{ text: 'OK' }]
            );
          }
        } finally {
          setIsProcessingOCR(false);
        }
      }
    } catch (error: any) {
      console.error('Error capturing mileage:', error);
      setIsProcessingOCR(false);
      
      if (error?.message?.includes('Cannot find native module')) {
        Alert.alert(
          'OCR Not Available',
          'Text recognition requires a development build.\n\n' +
          'Run: npx expo run:android (or npx expo run:ios)',
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert('Error', 'Failed to capture image. Please try again.');
      }
    }
  };

  const handleCaptureOdometerOCR = async () => {
    // Load and check if TextRecognition is available
    const ocrFunction = await loadTextRecognition();
    if (!ocrFunction) {
      Alert.alert(
        'OCR Not Available',
        'Text recognition requires a development build.\n\n' +
        'To use OCR:\n' +
        '1. Run: npx expo run:android (or npx expo run:ios)\n' +
        '2. This creates a development build with native modules\n' +
        '3. OCR will work in the development build\n\n' +
        'Note: OCR does not work in Expo Go.',
        [
          { text: 'OK' },
          {
            text: 'Learn More',
            onPress: () => {
              console.log('Development build required for OCR');
            },
          },
        ]
      );
      return;
    }

    try {
      // Request camera permissions
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert(
          'Permission Denied',
          'Camera permission is required to capture odometer readings.',
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
        const uri = result.assets[0].uri;
        setIsProcessingOdometerOCR(true);

        try {
          // Perform OCR on the image
          const textArray = await ocrFunction!(uri, false);
          
          // Combine all text lines into a single string
          const ocrText = textArray ? textArray.join(' ') : '';
          
          if (ocrText) {
            // Extract odometer from OCR text (same logic as mileage)
            const extractionResult = extractMileageFromOCR(ocrText);
            
            if (extractionResult.mileage !== null) {
              // Set the extracted odometer
              setOdometer(extractionResult.mileage.toString());
              
              // Clear any previous odometer errors
              if (errors.odometer) {
                setErrors({ ...errors, odometer: undefined });
              }

              // Show success message with confidence level
              const confidenceMessage = 
                extractionResult.confidence === 'high' 
                  ? 'High confidence' 
                  : extractionResult.confidence === 'medium'
                  ? 'Medium confidence'
                  : 'Low confidence - please verify';

              Alert.alert(
                'Odometer Extracted',
                `Extracted odometer: ${extractionResult.mileage.toLocaleString()}\n\n${confidenceMessage}`,
                [{ text: 'OK' }]
              );
            } else {
              Alert.alert(
                'No Odometer Found',
                'Could not find an odometer reading in the image. Please ensure the odometer is clearly visible and try again.',
                [{ text: 'OK' }]
              );
            }
          } else {
            Alert.alert(
              'OCR Failed',
              'Could not extract text from the image. Please try again with a clearer image.',
              [{ text: 'OK' }]
            );
          }
        } catch (ocrError: any) {
          console.error('OCR processing error:', ocrError);
          
          // Check if it's the native module error
          if (ocrError?.message?.includes('Cannot find native module') || 
              ocrError?.message?.includes('ExpoTextRecognition') ||
              ocrError?.message?.includes('getTextFromFrame')) {
            Alert.alert(
              'OCR Not Available',
              'Text recognition requires a development build.\n\n' +
              'Run: npx expo run:android (or npx expo run:ios)\n\n' +
              'OCR does not work in Expo Go.',
              [{ text: 'OK' }]
            );
          } else {
            Alert.alert(
              'Processing Error',
              'Failed to process the image. Please try again.',
              [{ text: 'OK' }]
            );
          }
        } finally {
          setIsProcessingOdometerOCR(false);
        }
      }
    } catch (error: any) {
      console.error('Error capturing odometer:', error);
      setIsProcessingOdometerOCR(false);
      
      if (error?.message?.includes('Cannot find native module')) {
        Alert.alert(
          'OCR Not Available',
          'Text recognition requires a development build.\n\n' +
          'Run: npx expo run:android (or npx expo run:ios)',
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert('Error', 'Failed to capture image. Please try again.');
      }
    }
  };

  const handleCaptureVinOCR = async () => {
    // Load and check if TextRecognition is available
    const ocrFunction = await loadTextRecognition();
    if (!ocrFunction) {
      Alert.alert(
        'OCR Not Available',
        'Text recognition requires a development build.\n\n' +
        'To use OCR:\n' +
        '1. Run: npx expo run:android (or npx expo run:ios)\n' +
        '2. This creates a development build with native modules\n' +
        '3. OCR will work in the development build\n\n' +
        'Note: OCR does not work in Expo Go.',
        [
          { text: 'OK' },
          {
            text: 'Learn More',
            onPress: () => {
              console.log('Development build required for OCR');
            },
          },
        ]
      );
      return;
    }

    try {
      // Request camera permissions
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert(
          'Permission Denied',
          'Camera permission is required to capture VIN numbers.',
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
        const uri = result.assets[0].uri;
        setIsProcessingVinOCR(true);

        try {
          // Perform OCR on the image
          const textArray = await ocrFunction!(uri, false);
          
          // Combine all text lines into a single string
          const ocrText = textArray ? textArray.join(' ') : '';
          
          if (ocrText) {
            // Extract VIN from OCR text
            const extractionResult = extractVinFromOCR(ocrText);
            
            if (extractionResult.vin !== null) {
              // Set the extracted VIN
              setVin(extractionResult.vin);
              
              // Clear any previous VIN errors
              if (errors.vin) {
                setErrors({ ...errors, vin: undefined });
              }

              // Show success message with confidence level
              const confidenceMessage = 
                extractionResult.confidence === 'high' 
                  ? 'High confidence' 
                  : extractionResult.confidence === 'medium'
                  ? 'Medium confidence'
                  : 'Low confidence - please verify';

              Alert.alert(
                'VIN Extracted',
                `Extracted VIN: ${extractionResult.vin}\n\n${confidenceMessage}`,
                [{ text: 'OK' }]
              );
            } else {
              Alert.alert(
                'No VIN Found',
                'Could not find a VIN number in the image. Please ensure the VIN is clearly visible and try again.',
                [{ text: 'OK' }]
              );
            }
          } else {
            Alert.alert(
              'OCR Failed',
              'Could not extract text from the image. Please try again with a clearer image.',
              [{ text: 'OK' }]
            );
          }
        } catch (ocrError: any) {
          console.error('OCR processing error:', ocrError);
          
          // Check if it's the native module error
          if (ocrError?.message?.includes('Cannot find native module') || 
              ocrError?.message?.includes('ExpoTextRecognition') ||
              ocrError?.message?.includes('getTextFromFrame')) {
            Alert.alert(
              'OCR Not Available',
              'Text recognition requires a development build.\n\n' +
              'Run: npx expo run:android (or npx expo run:ios)\n\n' +
              'OCR does not work in Expo Go.',
              [{ text: 'OK' }]
            );
          } else {
            Alert.alert(
              'Processing Error',
              'Failed to process the image. Please try again.',
              [{ text: 'OK' }]
            );
          }
        } finally {
          setIsProcessingVinOCR(false);
        }
      }
    } catch (error: any) {
      console.error('Error capturing VIN:', error);
      setIsProcessingVinOCR(false);
      
      if (error?.message?.includes('Cannot find native module')) {
        Alert.alert(
          'OCR Not Available',
          'Text recognition requires a development build.\n\n' +
          'Run: npx expo run:android (or npx expo run:ios)',
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert('Error', 'Failed to capture image. Please try again.');
      }
    }
  };

  const validateForm = () => {
    const newErrors: {
      vin?: string;
      mileage?: string;
      odometer?: string;
    } = {};

    if (!vin.trim()) {
      newErrors.vin = 'VIN is required';
    }

    if (!mileage.trim()) {
      newErrors.mileage = 'Mileage is required';
    } else if (isNaN(parseInt(mileage, 10))) {
      newErrors.mileage = 'Mileage must be a valid number';
    }

    if (!odometer.trim()) {
      newErrors.odometer = 'Odometer is required';
    } else if (isNaN(parseInt(odometer, 10))) {
      newErrors.odometer = 'Odometer must be a valid number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!assetName || !vin) {
      return;
    }

    if (!validateForm()) {
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
      state: state || null,
    };

    await onSave(assetData);
  };

  const handleClose = () => {
    if (!loading) {
      onClose();
    }
  };

  const isFormValid = assetName.trim() && vin.trim() && mileage.trim() && odometer.trim();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingContainer}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        <View style={styles.overlay}>
          <TouchableWithoutFeedback onPress={handleClose}>
            <View style={styles.backdrop} />
          </TouchableWithoutFeedback>
          <View style={styles.modalContainer}>
            <ScrollView
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              nestedScrollEnabled={true}
              scrollEnabled={true}
              bounces={false}
              alwaysBounceVertical={false}
              contentInsetAdjustmentBehavior="automatic"
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
                      <View>
                        <View style={styles.mileageInputContainer}>
                          <View style={styles.mileageInputWrapper}>
                            <Input
                              variant="text"
                              label="VIN *"
                              value={vin}
                              onChangeText={(text) => {
                                setVin(text);
                                if (errors.vin) {
                                  setErrors({ ...errors, vin: undefined });
                                }
                              }}
                              style={[styles.input, styles.mileageInput]}
                              autoCapitalize="characters"
                              editable={!loading && !isProcessingVinOCR}
                              placeholder="Enter VIN number"
                            />
                          </View>
                          <TouchableOpacity
                            onPress={handleCaptureVinOCR}
                            style={[
                              styles.ocrButton,
                              (loading || isProcessingVinOCR) && styles.ocrButtonDisabled,
                            ]}
                            disabled={loading || isProcessingVinOCR}
                          >
                            {isProcessingVinOCR ? (
                              <ActivityIndicator size="small" color="#fff" />
                            ) : (
                              <Text style={styles.ocrButtonText}>📷 OCR</Text>
                            )}
                          </TouchableOpacity>
                        </View>
                        {errors.vin && (
                          <Text style={styles.errorText}>{errors.vin}</Text>
                        )}
                        {isProcessingVinOCR && (
                          <Text style={styles.processingText}>
                            Processing image...
                          </Text>
                        )}
                      </View>
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
                      <View style={styles.inputContainer}>
                        <Text style={styles.dropdownLabel}>State</Text>
                        <TouchableOpacity
                          style={styles.dropdownButton}
                          onPress={() => setShowStatePicker(true)}
                          disabled={loading}
                        >
                          <Text style={[styles.dropdownButtonText, !state && styles.dropdownPlaceholder]}>
                            {state || 'Select state'}
                          </Text>
                          <Text style={styles.dropdownArrow}>▼</Text>
                        </TouchableOpacity>
                      </View>
                      <View>
                        <View style={styles.mileageInputContainer}>
                          <View style={styles.mileageInputWrapper}>
                            <Input
                              variant="text"
                              label="Odometer *"
                              value={odometer}
                              onChangeText={(text) => {
                                setOdometer(text);
                                if (errors.odometer) {
                                  setErrors({ ...errors, odometer: undefined });
                                }
                              }}
                              style={[styles.input, styles.mileageInput]}
                              keyboardType="numeric"
                              editable={!loading && !isProcessingOdometerOCR}
                              placeholder="Enter odometer reading"
                            />
                          </View>
                          <TouchableOpacity
                            onPress={handleCaptureOdometerOCR}
                            style={[
                              styles.ocrButton,
                              (loading || isProcessingOdometerOCR) && styles.ocrButtonDisabled,
                            ]}
                            disabled={loading || isProcessingOdometerOCR}
                          >
                            {isProcessingOdometerOCR ? (
                              <ActivityIndicator size="small" color="#fff" />
                            ) : (
                              <Text style={styles.ocrButtonText}>📷 OCR</Text>
                            )}
                          </TouchableOpacity>
                        </View>
                        {errors.odometer && (
                          <Text style={styles.errorText}>{errors.odometer}</Text>
                        )}
                        {isProcessingOdometerOCR && (
                          <Text style={styles.processingText}>
                            Processing image...
                          </Text>
                        )}
                      </View>
                      <View>
                        <View style={styles.mileageInputContainer}>
                          <View style={styles.mileageInputWrapper}>
                            <Input
                              variant="text"
                              label="Mileage *"
                              value={mileage}
                              onChangeText={(text) => {
                                setMileage(text);
                                if (errors.mileage) {
                                  setErrors({ ...errors, mileage: undefined });
                                }
                              }}
                              style={[styles.input, styles.mileageInput]}
                              keyboardType="numeric"
                              editable={!loading && !isProcessingOCR}
                              placeholder="Enter mileage"
                            />
                          </View>
                          <TouchableOpacity
                            onPress={handleCaptureMileageOCR}
                            style={[
                              styles.ocrButton,
                              (loading || isProcessingOCR) && styles.ocrButtonDisabled,
                            ]}
                            disabled={loading || isProcessingOCR}
                          >
                            {isProcessingOCR ? (
                              <ActivityIndicator size="small" color="#fff" />
                            ) : (
                              <Text style={styles.ocrButtonText}>📷 OCR</Text>
                            )}
                          </TouchableOpacity>
                        </View>
                        {errors.mileage && (
                          <Text style={styles.errorText}>{errors.mileage}</Text>
                        )}
                        {isProcessingOCR && (
                          <Text style={styles.processingText}>
                            Processing image...
                          </Text>
                        )}
                      </View>
                      
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
          </View>
        </View>
      </KeyboardAvoidingView>
      
      {/* State Picker Modal */}
      <Modal
        visible={showStatePicker}
        transparent
        animationType="fade"
        onRequestClose={() => setShowStatePicker(false)}
      >
        <TouchableWithoutFeedback onPress={() => setShowStatePicker(false)}>
          <View style={styles.pickerModalOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.pickerModalContent}>
                <View style={styles.pickerHeader}>
                  <Text style={styles.pickerTitle}>Select State</Text>
                  <TouchableOpacity
                    onPress={() => setShowStatePicker(false)}
                    style={styles.pickerCloseButton}
                  >
                    <Text style={styles.pickerCloseButtonText}>✕</Text>
                  </TouchableOpacity>
                </View>
                <ScrollView style={styles.pickerScrollView}>
                  {states.map((stateOption) => (
                    <TouchableOpacity
                      key={stateOption}
                      style={[
                        styles.pickerOption,
                        state === stateOption && styles.pickerOptionSelected,
                      ]}
                      onPress={() => {
                        setState(stateOption);
                        setShowStatePicker(false);
                      }}
                    >
                      <Text
                        style={[
                          styles.pickerOptionText,
                          state === stateOption && styles.pickerOptionTextSelected,
                        ]}
                      >
                        {stateOption}
                      </Text>
                      {state === stateOption && (
                        <Text style={styles.pickerCheckmark}>✓</Text>
                      )}
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </Modal>
  );
};

const styles = StyleSheet.create({
  keyboardAvoidingContainer: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  modalContainer: {
    width: '100%',
    maxWidth: 500,
    maxHeight: '90%',
    minHeight: 450,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 20,
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
  errorText: {
    color: '#ff4444',
    fontSize: 12,
    marginTop: 4,
    marginBottom: 8,
    marginLeft: 4,
  },
  dropdownLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
    marginBottom: 8,
    marginLeft: 4,
  },
  dropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 48,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingTop: 14,
    paddingRight: 12,
    paddingBottom: 14,
    paddingLeft: 12,
    marginBottom: 16,
  },
  dropdownButtonText: {
    flex: 1,
    fontSize: 16,
    color: '#000',
  },
  dropdownPlaceholder: {
    color: '#999',
  },
  dropdownArrow: {
    fontSize: 12,
    color: '#666',
    marginLeft: 8,
  },
  pickerModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  pickerModalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    width: '100%',
    maxWidth: 400,
    maxHeight: '70%',
  },
  pickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  pickerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
  },
  pickerCloseButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 16,
    backgroundColor: '#f0f0f0',
  },
  pickerCloseButtonText: {
    fontSize: 18,
    color: '#666',
    fontWeight: 'bold',
  },
  pickerScrollView: {
    maxHeight: 300,
  },
  pickerOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  pickerOptionSelected: {
    backgroundColor: '#f0f8f6',
  },
  pickerOptionText: {
    fontSize: 16,
    color: '#000',
  },
  pickerOptionTextSelected: {
    color: '#14AB98',
    fontWeight: '600',
  },
  pickerCheckmark: {
    fontSize: 18,
    color: '#14AB98',
    fontWeight: 'bold',
  },
  mileageInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  mileageInputWrapper: {
    flex: 1,
  },
  mileageInput: {
    marginBottom: 0,
  },
  ocrButton: {
    backgroundColor: '#14AB98',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 80,
    height: 48,
    marginBottom: 0,
  },
  ocrButtonDisabled: {
    backgroundColor: '#ccc',
    opacity: 0.6,
  },
  ocrButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  processingText: {
    color: '#14AB98',
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
    fontStyle: 'italic',
  },
});


