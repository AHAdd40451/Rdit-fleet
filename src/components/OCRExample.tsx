import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';

// Conditionally import TextRecognition - it requires native code
// Use dynamic import for better compatibility with Expo modules
let getTextFromFrame: ((inputString: string, isBase64?: boolean) => Promise<string[]>) | null = null;
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
      
      if (typeof textRecognitionModule.getTextFromFrame === 'function') {
        getTextFromFrame = textRecognitionModule.getTextFromFrame;
        console.log('✅ Found getTextFromFrame as named export');
        return getTextFromFrame;
      } 
      else if (textRecognitionModule.default && typeof textRecognitionModule.default.getTextFromFrame === 'function') {
        getTextFromFrame = textRecognitionModule.default.getTextFromFrame;
        console.log('✅ Found getTextFromFrame in default export');
        return getTextFromFrame;
      }
      else if (typeof textRecognitionModule.default === 'function') {
        getTextFromFrame = textRecognitionModule.default;
        console.log('✅ Using default export as function');
        return getTextFromFrame;
      }
      
      console.error('❌ expo-text-recognition module loaded but getTextFromFrame not found. Module structure:', {
        module: textRecognitionModule,
        keys: Object.keys(textRecognitionModule),
      });
      return null;
    } catch (error: any) {
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

/**
 * Complete OCR Example Component
 * 
 * This component demonstrates:
 * - Camera permission handling
 * - Image capture with expo-image-picker
 * - OCR text extraction with expo-text-recognition
 * - Displaying extracted text
 * - Clean, minimal UI
 * 
 * Works in Expo Go (no custom native code required)
 */
export const OCRExample: React.FC = () => {
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [extractedText, setExtractedText] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);

  // Check camera permissions on mount
  React.useEffect(() => {
    checkCameraPermission();
  }, []);

  const checkCameraPermission = async () => {
    try {
      const { status } = await ImagePicker.getCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    } catch (error) {
      console.error('Error checking camera permission:', error);
      setHasPermission(false);
    }
  };

  const requestCameraPermission = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert(
          'Permission Denied',
          'Camera permission is required to take photos for OCR.',
          [
            { text: 'Cancel', style: 'cancel' },
            { 
              text: 'Open Settings', 
              onPress: () => {
                // On iOS, this will open Settings app
                // On Android, user needs to manually grant permission
                Alert.alert(
                  'Permission Required',
                  'Please enable camera permission in your device settings.'
                );
              }
            }
          ]
        );
        setHasPermission(false);
        return false;
      }
      
      setHasPermission(true);
      return true;
    } catch (error) {
      console.error('Error requesting camera permission:', error);
      Alert.alert('Error', 'Failed to request camera permission.');
      setHasPermission(false);
      return false;
    }
  };

  const handleTakePhoto = async () => {
    // Check/request permission first
    if (hasPermission === false) {
      const granted = await requestCameraPermission();
      if (!granted) return;
    }

    try {
      // Launch camera
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const uri = result.assets[0].uri;
        setImageUri(uri);
        setExtractedText(''); // Clear previous text
        
        // Automatically process the image
        await processImage(uri);
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'Failed to take photo. Please try again.');
    }
  };

  const handlePickImage = async () => {
    try {
      // Request media library permission
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert(
          'Permission Denied',
          'Media library permission is required to select images.',
          [{ text: 'OK' }]
        );
        return;
      }

      // Launch image picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const uri = result.assets[0].uri;
        setImageUri(uri);
        setExtractedText(''); // Clear previous text
        
        // Automatically process the image
        await processImage(uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    }
  };

  const processImage = async (uri: string) => {
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
        [{ text: 'OK' }]
      );
      setIsProcessing(false);
      return;
    }

    setIsProcessing(true);
    
    try {
      // Perform OCR on the image
      // getTextFromFrame expects a file path or base64 string
      const textArray = await ocrFunction(uri, false);
      
      // Combine all text lines into a single string
      const extractedTextResult = textArray ? textArray.join('\n') : '';
      
      if (extractedTextResult) {
        setExtractedText(extractedTextResult);
      } else {
        setExtractedText('No text found in the image.');
      }
    } catch (error: any) {
      console.error('Error processing image:', error);
      
      // Check if it's the native module error
      if (error?.message?.includes('Cannot find native module') || 
          error?.message?.includes('ExpoTextRecognition') ||
          error?.message?.includes('getTextFromFrame')) {
        Alert.alert(
          'OCR Not Available',
          'Text recognition requires a development build.\n\n' +
          'Run: npx expo run:android (or npx expo run:ios)\n\n' +
          'OCR does not work in Expo Go.',
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert(
          'OCR Error',
          'Failed to extract text from image. Please try again with a clearer image.'
        );
      }
      setExtractedText('');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClear = () => {
    setImageUri(null);
    setExtractedText('');
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.header}>
        <Text style={styles.title}>OCR Text Recognition</Text>
        <Text style={styles.subtitle}>
          Take a photo or select an image to extract printed text
        </Text>
      </View>

      {/* Image Preview */}
      {imageUri && (
        <View style={styles.imageContainer}>
          <Image source={{ uri: imageUri }} style={styles.image} />
          {isProcessing && (
            <View style={styles.processingOverlay}>
              <ActivityIndicator size="large" color="#14AB98" />
              <Text style={styles.processingText}>Processing image...</Text>
            </View>
          )}
        </View>
      )}

      {/* Action Buttons */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, styles.cameraButton]}
          onPress={handleTakePhoto}
          disabled={isProcessing}
        >
          <Text style={styles.buttonText}>📷 Take Photo</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.galleryButton]}
          onPress={handlePickImage}
          disabled={isProcessing}
        >
          <Text style={styles.buttonText}>🖼️ Pick from Gallery</Text>
        </TouchableOpacity>

        {imageUri && (
          <TouchableOpacity
            style={[styles.button, styles.clearButton]}
            onPress={handleClear}
            disabled={isProcessing}
          >
            <Text style={styles.buttonText}>Clear</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Extracted Text Display */}
      {extractedText ? (
        <View style={styles.textContainer}>
          <Text style={styles.textLabel}>Extracted Text:</Text>
          <View style={styles.textBox}>
            <Text style={styles.extractedText}>{extractedText}</Text>
          </View>
        </View>
      ) : imageUri && !isProcessing ? (
        <View style={styles.textContainer}>
          <Text style={styles.placeholderText}>
            No text extracted. Try with a clearer image containing printed text.
          </Text>
        </View>
      ) : null}

      {/* Permission Status */}
      {hasPermission === false && (
        <View style={styles.permissionContainer}>
          <Text style={styles.permissionText}>
            Camera permission is required. Tap "Take Photo" to request permission.
          </Text>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  contentContainer: {
    padding: 20,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    lineHeight: 24,
  },
  imageContainer: {
    width: '100%',
    marginBottom: 20,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#f0f0f0',
    position: 'relative',
  },
  image: {
    width: '100%',
    height: 300,
    resizeMode: 'contain',
  },
  processingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  processingText: {
    color: '#fff',
    marginTop: 12,
    fontSize: 16,
    fontWeight: '600',
  },
  buttonContainer: {
    gap: 12,
    marginBottom: 24,
  },
  button: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraButton: {
    backgroundColor: '#14AB98',
  },
  galleryButton: {
    backgroundColor: '#666',
  },
  clearButton: {
    backgroundColor: '#ff4444',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  textContainer: {
    marginTop: 8,
  },
  textLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    marginBottom: 12,
  },
  textBox: {
    backgroundColor: '#f8f8f8',
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    minHeight: 100,
  },
  extractedText: {
    fontSize: 16,
    color: '#000',
    lineHeight: 24,
  },
  placeholderText: {
    fontSize: 14,
    color: '#999',
    fontStyle: 'italic',
    textAlign: 'center',
    padding: 16,
  },
  permissionContainer: {
    backgroundColor: '#fff3cd',
    padding: 16,
    borderRadius: 8,
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#ffc107',
  },
  permissionText: {
    fontSize: 14,
    color: '#856404',
    textAlign: 'center',
  },
});
