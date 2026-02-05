npm start => project start web and app both 

for native build
   npx expo prebuild --platform android
   npm run build:android:release
The APK will be at android/app/build/outputs/apk/release/app-release.apk.

for expo build
eas build --platform android --profile production

for deploy supabse edge function
supabase functions deploy function_name 

for run build preview locally 
npx expo prebuild --clean
npx expo run:android

for test push notification run this function
npm run test:push-notification