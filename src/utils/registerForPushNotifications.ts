import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

export interface PushTokenData {
  token: string;
  deviceId: string | null;
  platform: 'ios' | 'android';
}

export async function registerForPushNotificationsAsync(): Promise<PushTokenData | null> {
  // Allow on simulator/emulator for development, but warn
  if (!Device.isDevice) {
    console.warn('Push notifications work best on physical devices');
    // Still try to get token on simulator for development
  }

  const { status: existingStatus } =
    await Notifications.getPermissionsAsync();

  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.warn('Failed to get push notification permissions');
    return null;
  }

  try {
    // Get project ID from various sources
    // For EAS projects, this should be in app.config.js or eas.json
    const projectId: string | undefined = 
      Constants.expoConfig?.extra?.eas?.projectId || 
      Constants.easConfig?.projectId ||
      process.env.EXPO_PUBLIC_EAS_PROJECT_ID;
    
    // ProjectId is required for push notifications
    if (!projectId) {
      console.warn(
        '⚠️ Push notifications require a projectId. ' +
        'To enable push notifications:\n' +
        '1. Run: npx eas init (to create an EAS project)\n' +
        '2. Or get your projectId from: https://expo.dev\n' +
        '3. Add it to app.config.js: extra.eas.projectId = "your-project-id"\n' +
        '4. Or add to .env: EXPO_PUBLIC_EAS_PROJECT_ID=your-project-id'
      );
      return null;
    }
    
    // Get push token with projectId
    const tokenResponse = await Notifications.getExpoPushTokenAsync({
      projectId,
    });
    const token = tokenResponse.data;

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }

    const deviceId = Device.modelId || Device.modelName || null;

    return {
      token,
      deviceId,
      platform: Platform.OS as 'ios' | 'android',
    };
  } catch (error) {
    console.error('Error getting push token:', error);
    return null;
  }
}
