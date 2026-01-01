# Development Build Instructions for OCR

## ⚠️ Why Development Build?

The `expo-text-recognition` package requires native code compilation and **does not work in Expo Go**. You need to create a development build to use OCR features.

## 🚀 Quick Start

### For Android:

```bash
# Make sure you have Android Studio and Android SDK installed
npx expo run:android
```

This will:
1. Compile all native modules (including OCR)
2. Build the Android app
3. Install it on your connected device/emulator
4. Start the Metro bundler

### For iOS (macOS only):

```bash
# Make sure you have Xcode installed
npx expo run:ios
```

This will:
1. Compile all native modules (including OCR)
2. Build the iOS app
3. Install it on your connected device/simulator
4. Start the Metro bundler

## 📋 Prerequisites

### Android:
- [Android Studio](https://developer.android.com/studio) installed
- Android SDK configured
- Android device connected via USB (with USB debugging enabled) OR Android emulator running

### iOS:
- macOS computer
- [Xcode](https://developer.apple.com/xcode/) installed
- iOS device connected (for physical device) OR iOS Simulator

## 🔧 What Happens During Build?

1. **Native Module Compilation**: All native modules (including `expo-text-recognition`) are compiled
2. **App Bundle Creation**: Your app is bundled with all native code
3. **Installation**: The app is installed on your device/emulator
4. **Development Server**: Metro bundler starts for hot reloading

## 🎯 After Building

Once the development build is installed:
- ✅ OCR will work perfectly
- ✅ All native modules will be available
- ✅ You can still use hot reloading
- ✅ You can still use Expo Dev Tools

## 🔄 Updating Native Modules

If you add new native modules or update existing ones:

```bash
# Rebuild the app
npx expo run:android
# or
npx expo run:ios
```

## 💡 Tips

1. **First build takes longer** - Subsequent builds are faster due to caching
2. **Keep device connected** - For faster iteration during development
3. **Use emulator for testing** - Faster than physical devices for some tests
4. **Physical device for OCR** - Real camera works better than emulator camera

## 🐛 Troubleshooting

### "Command not found: npx"
```bash
npm install -g npm
```

### Android: "SDK not found"
- Open Android Studio
- Go to SDK Manager
- Install Android SDK Platform Tools

### iOS: "Xcode not found"
- Install Xcode from App Store
- Run: `sudo xcode-select --switch /Applications/Xcode.app`

### Build fails with module errors
```bash
# Clear cache and rebuild
npx expo start --clear
npx expo run:android
```

## 📚 More Information

- [Expo Development Builds Documentation](https://docs.expo.dev/development/introduction/)
- [Expo Native Modules Guide](https://docs.expo.dev/bare/installing-unimodules/)

## ✅ Verification

After building, test OCR:
1. Open the app on your device
2. Go to Assets screen
3. Click "Add Asset"
4. Click "📷 OCR" button next to Mileage
5. Take a photo - OCR should work!
