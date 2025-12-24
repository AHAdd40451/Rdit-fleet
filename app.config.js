require('dotenv').config();

module.exports = {
  expo: {
    name: 'redit-fleet',
    slug: 'redit-fleet',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/icon.png',
    userInterfaceStyle: 'light',
    newArchEnabled: true,
    scheme: 'redit-fleet',

    splash: {
      image: './assets/splash-icon.png',
      resizeMode: 'contain',
      backgroundColor: '#ffffff',
    },

    ios: {
      supportsTablet: true,
      infoPlist: {
        NSCameraUsageDescription:
          'This app needs access to your camera to take photos of assets.',
      },
    },

    android: {
      package: 'com.anonymous.reditfleet',

      // 🔴 REQUIRED FOR ANDROID PUSH (FCM)
      googleServicesFile: './android/app/google-services.json',

      adaptiveIcon: {
        foregroundImage: './assets/adaptive-icon.png',
        backgroundColor: '#ffffff',
      },

      edgeToEdgeEnabled: true,
      predictiveBackGestureEnabled: false,
      permissions: ['CAMERA'],
    },

    notification: {
      icon: './assets/icon.png',
      color: '#ffffff',
    },

    web: {
      favicon: './assets/favicon.png',
    },

    plugins: [
      'expo-router',
      [
        'expo-notifications',
        {
          icon: './assets/icon.png',
          color: '#ffffff',
          sounds: [],
        },
      ],
    ],

    updates: {
      enabled: false,
      fallbackToCacheTimeout: 0,
    },

    extra: {
      supabaseUrl:
        process.env.EXPO_PUBLIC_SUPABASE_URL ||
        'https://xejtgfdjfgrzauvztsod.supabase.co',

      supabaseAnonKey:
        process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ||
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhlanRnZmRqZmdyemF1dnp0c29kIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUzOTY1MDMsImV4cCI6MjA4MDk3MjUwM30.CWBmGhPxHF0CC68M1TReTWJMu6tWYFqic1FaYT5jdAs',

      eas: {
        projectId: 'd9ae98c5-4042-4ff3-9094-930cad7e7154',
      },
    },
  },
};
