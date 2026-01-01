# OCR Text Recognition Setup Guide

This guide explains how to use OCR (Optical Character Recognition) to extract mileage readings from images in the Redit Fleet app.

## 📦 Installation

The required packages are already installed. If you need to reinstall:

```bash
# Install expo-text-recognition (compatible with Expo SDK 54)
npx expo install expo-text-recognition

# expo-image-picker is already installed
```

## ✅ Permissions

The app already has camera permissions configured in `app.config.js`:

- **iOS**: `NSCameraUsageDescription` - "This app needs access to your camera to take photos of assets."
- **Android**: `CAMERA` permission in the permissions array

No additional configuration is needed.

## 🚀 Usage

### 1. Standalone OCR Example Component

A complete example component is available at `src/components/OCRExample.tsx`. This demonstrates:

- Camera permission handling
- Image capture with expo-image-picker
- OCR text extraction with expo-text-recognition
- Displaying extracted text
- Clean, minimal UI

**To use it in your app:**

```tsx
import { OCRExample } from '../src/components/OCRExample';

// In your component
<OCRExample />
```

### 2. Integrated Mileage OCR in AssetModal

The `AssetModal` component now includes OCR functionality for extracting mileage from images:

1. **Open the Asset Modal** (Create or Edit Asset)
2. **Navigate to the Mileage field**
3. **Click the "📷 OCR" button** next to the mileage input
4. **Take a photo** of the odometer/mileage display
5. **The mileage will be automatically extracted and filled in**

The OCR system:
- Automatically processes the captured image
- Extracts numeric values that look like mileage readings
- Uses intelligent filtering to find the most likely mileage value
- Shows confidence levels (high/medium/low)
- Allows you to verify and edit the extracted value

### 3. Utility Functions

The mileage extraction utility is available at `src/utils/extractMileageFromOCR.ts`:

```tsx
import { extractMileageFromOCR, extractFirstMileage } from '../utils/extractMileageFromOCR';

// Full extraction with confidence and all numbers
const result = extractMileageFromOCR(ocrText);
// Returns: { mileage, confidence, extractedText, allNumbers }

// Quick extraction (just the mileage number)
const mileage = extractFirstMileage(ocrText);
// Returns: number | null
```

## 🎯 How It Works

### OCR Process

1. **Image Capture**: User takes a photo using the camera
2. **Text Recognition**: `expo-text-recognition` extracts all text from the image
3. **Mileage Extraction**: Custom algorithm finds numeric patterns that look like mileage
4. **Filtering**: Numbers are filtered based on:
   - Typical mileage range (100 - 999,999)
   - Number of digits (4-7 digits preferred)
   - Context and patterns
5. **Confidence Scoring**: Each candidate is scored, and the best match is selected

### Mileage Extraction Algorithm

The extraction algorithm:
- Finds all numbers in the OCR text
- Filters numbers in reasonable mileage ranges
- Scores candidates based on:
  - Ideal range (10,000 - 200,000 miles)
  - Number of digits (5-6 digits preferred)
  - Context clues
- Returns the highest-scoring candidate with confidence level

## ⚠️ Important: Development Build Required

**`expo-text-recognition` does NOT work in Expo Go** because it requires native code compilation.

### To Use OCR:

You need to create a **development build**:

```bash
# For Android
npx expo run:android

# For iOS
npx expo run:ios
```

This will:
1. Compile the native modules
2. Create a development build with OCR support
3. Install it on your device/emulator

### Why Development Build?

- Expo Go only includes a limited set of pre-compiled native modules
- `expo-text-recognition` requires native code that's not in Expo Go
- Development builds include all your app's native dependencies

## 📱 Testing

### Testing with Development Build

1. **Create a development build**:
   ```bash
   # Android
   npx expo run:android
   
   # iOS (requires macOS)
   npx expo run:ios
   ```

2. **The app will install automatically** on your device/emulator

3. **Test the OCR feature**:
   - Navigate to Assets screen
   - Click "Add Asset" or edit an existing asset
   - Click the "📷 OCR" button next to Mileage
   - Grant camera permission when prompted
   - Take a photo of a mileage display
   - Verify the extracted mileage

### Testing in Expo Go (Limited)

If you try to use OCR in Expo Go, you'll see a helpful error message explaining that a development build is required. The app will gracefully handle this and show instructions.

### Best Practices for OCR

For best OCR results:
- ✅ Ensure good lighting
- ✅ Keep the camera steady
- ✅ Make sure numbers are clearly visible
- ✅ Avoid glare and reflections
- ✅ Capture the entire odometer display
- ✅ Use a clean, readable font if possible

## 🔧 Troubleshooting

### "Permission Denied" Error

- **iOS**: Go to Settings > [Your App] > Camera and enable permission
- **Android**: The app will prompt automatically, or go to Settings > Apps > [Your App] > Permissions > Camera

### "No text found" or Poor Extraction

- Ensure the image is clear and well-lit
- Make sure numbers are large and readable
- Try capturing from a different angle
- Verify the odometer display is in focus

### OCR Not Working in Expo Go

- `expo-text-recognition` works in Expo Go, but some features may be limited
- For full functionality, consider using a development build:
  ```bash
  npx expo run:android
  # or
  npx expo run:ios
  ```

## 📚 API Reference

### OCRExample Component

A standalone component demonstrating OCR functionality.

**Props**: None (self-contained)

**Features**:
- Camera permission handling
- Image capture (camera or gallery)
- OCR text extraction
- Text display
- Error handling

### extractMileageFromOCR Function

```typescript
function extractMileageFromOCR(ocrText: string): MileageExtractionResult

interface MileageExtractionResult {
  mileage: number | null;
  confidence: 'high' | 'medium' | 'low';
  extractedText: string;
  allNumbers: number[];
}
```

### extractFirstMileage Function

```typescript
function extractFirstMileage(ocrText: string): number | null
```

Quick helper that returns just the mileage number or null.

## 🎨 Customization

### Styling

The OCR button in AssetModal can be customized in `src/components/AssetModal.tsx`:

```tsx
// Modify styles in the StyleSheet
ocrButton: {
  backgroundColor: '#14AB98', // Change color
  // ... other styles
}
```

### Extraction Logic

To customize mileage extraction logic, edit `src/utils/extractMileageFromOCR.ts`:

- Adjust `getMileageScore()` to change scoring algorithm
- Modify filtering ranges in `extractMileageFromOCR()`
- Add custom patterns for specific odometer formats

## 📝 Notes

- OCR works best with printed text (not handwritten)
- Results may vary based on image quality
- Always verify extracted values before saving
- The system is designed for vehicle odometer readings (typically 4-7 digits)

## 🔗 Related Files

- `src/components/OCRExample.tsx` - Standalone OCR example
- `src/components/AssetModal.tsx` - Asset modal with integrated OCR
- `src/utils/extractMileageFromOCR.ts` - Mileage extraction utility
- `app.config.js` - Permission configuration
