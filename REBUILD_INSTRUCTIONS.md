# Rebuild Instructions After Adding expo-text-recognition Plugin

## ⚠️ Important: Rebuild Required

After adding `expo-text-recognition` to the plugins array in `app.config.js`, you **must rebuild** your app.

## Steps to Rebuild

### Option 1: Clean Rebuild (Recommended)

```bash
# 1. Clean the build
npx expo prebuild --clean

# 2. Rebuild for Android
npx expo run:android
```

### Option 2: Full Clean Rebuild

```bash
# 1. Remove native folders
rm -rf android ios

# 2. Regenerate native code
npx expo prebuild

# 3. Rebuild for Android
npx expo run:android
```

### Option 3: If using EAS Build

```bash
# Rebuild with EAS
eas build --platform android --profile development
```

## Why Rebuild?

When you add a new plugin to `app.config.js`:
- The plugin needs to be registered in the native Android/iOS projects
- Native code needs to be regenerated
- The app needs to be recompiled with the new native module

## Verification

After rebuilding, check the console logs when you tap the OCR button. You should see:
- `✅ Found getTextFromFrame as named export` (or similar success message)
- The OCR function should work

If you still see errors, check the console logs to see what the module structure looks like.

## Troubleshooting

### Still getting "OCR not available" error?

1. **Check console logs** - Look for the module structure logs
2. **Verify plugin is in app.config.js** - Should see `'expo-text-recognition'` in plugins array
3. **Make sure you rebuilt** - Just running `expo start` is not enough
4. **Check native build** - Make sure `npx expo run:android` completed successfully

### Module structure logs

When you tap the OCR button, check the console for logs like:
```
expo-text-recognition module loaded: { keys: [...], hasDefault: ..., ... }
```

This will help identify what's actually exported from the module.
