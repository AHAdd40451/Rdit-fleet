# Push Notifications Setup Guide

This guide explains how push notifications are implemented in the Redi Fleet app and how to set them up.

## Overview

The app uses Expo's Push Notification Service to send push notifications to users. Push tokens are stored in Supabase and can be used to send notifications from your backend.

## Implementation Details

### 1. Database Setup

First, run the SQL migration to create the `push_tokens` table:

```sql
-- Run this in your Supabase SQL editor
-- File: supabase_push_tokens_setup.sql
```

This creates a table to store push notification tokens for each user.

### 2. Client-Side Implementation

The app automatically:
- Registers for push notifications when a user logs in
- Saves the push token to Supabase
- Listens for incoming notifications
- Handles notification taps and navigation

**Key Files:**
- `src/utils/registerForPushNotifications.ts` - Registers device for push notifications
- `src/utils/savePushToken.ts` - Saves/updates tokens in Supabase
- `src/contexts/AuthContext.tsx` - Registers tokens on login
- `app/_layout.tsx` - Sets up notification listeners

### 3. Sending Push Notifications

To send push notifications, you have several options:

#### Option A: Using Supabase Edge Functions (Recommended)

Create a Supabase Edge Function that:
1. Fetches push tokens for target users
2. Sends notifications via Expo Push Notification Service

See `supabase_send_notification_function.sql` for example code.

#### Option B: Using a Backend API

Use the helper functions in `src/utils/sendPushNotification.ts` from your backend:

```typescript
import { sendPushNotification } from './src/utils/sendPushNotification';

// Send to a single user
await sendPushNotification(userId, {
  title: 'New Asset Created',
  body: 'A new asset has been added to your fleet',
  data: { type: 'asset_created', asset_id: '123' }
});

// Send to multiple users
await sendPushNotification([userId1, userId2], {
  title: 'Maintenance Reminder',
  body: 'Your vehicle needs maintenance',
  data: { type: 'maintenance_reminder' }
});
```

#### Option C: Using Database Triggers

You can create PostgreSQL triggers that automatically send notifications when certain events occur (e.g., when an asset is created).

See `supabase_send_notification_function.sql` for trigger examples.

### 4. Testing Push Notifications

#### Using Expo's Push Notification Tool

1. Get a push token from your device (check console logs after login)
2. Visit: https://expo.dev/notifications
3. Enter the token and send a test notification

#### Using cURL

```bash
curl -H "Content-Type: application/json" \
     -X POST https://exp.host/--/api/v2/push/send \
     -d '{
       "to": "ExponentPushToken[YOUR_TOKEN_HERE]",
       "title": "Test Notification",
       "body": "This is a test notification",
       "data": { "type": "test" }
     }'
```

### 5. Configuration

#### app.config.js

The app is already configured with the `expo-notifications` plugin. If you need to customize:

```javascript
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
```

#### EAS Project ID (Optional)

If you're using EAS Build, you may need to add your project ID to `app.config.js`:

```javascript
extra: {
  eas: {
    projectId: 'your-project-id'
  }
}
```

Get your project ID from: https://expo.dev/accounts/[your-account]/projects/[your-project]

### 6. Notification Payload Structure

When sending notifications, include data that helps with navigation:

```typescript
{
  title: 'Notification Title',
  body: 'Notification body text',
  data: {
    type: 'asset_created', // Used for routing
    asset_id: '123',       // Additional data
  },
  priority: 'high',        // 'default' | 'normal' | 'high'
  sound: 'default',        // 'default' | null
}
```

### 7. Notification Types

The app currently handles these notification types:
- `asset_created` - Navigates to assets screen
- `maintenance_reminder` - Shows maintenance info
- Default - Navigates to notifications screen

You can add more types in `app/_layout.tsx` in the notification response handler.

### 8. Troubleshooting

#### Notifications not working?

1. **Check permissions**: Ensure the app has notification permissions
2. **Check device**: Push notifications require a physical device (simulators have limited support)
3. **Check token**: Verify the token is saved in the `push_tokens` table
4. **Check Expo account**: Ensure you're using a valid Expo account for push notifications

#### Token not saving?

- Check Supabase RLS policies allow the user to insert/update tokens
- Check console for errors when logging in
- Verify the `push_tokens` table exists

#### Notifications not received?

- Check internet connection
- Verify the token format is correct (starts with `ExponentPushToken[`)
- Check Expo Push Notification Service status
- Verify the notification payload is valid

### 9. Production Considerations

1. **Error Handling**: The app gracefully handles notification failures
2. **Token Updates**: Tokens are automatically updated when they change
3. **Token Cleanup**: Tokens are removed when users log out
4. **Rate Limiting**: Be mindful of Expo's rate limits (see Expo docs)

### 10. Next Steps

1. Run the SQL migration in Supabase
2. Test push notifications on a physical device
3. Set up your backend/Edge Function to send notifications
4. Customize notification handling based on your needs

## Additional Resources

- [Expo Push Notifications Documentation](https://docs.expo.dev/push-notifications/overview/)
- [Expo Push Notification Service API](https://docs.expo.dev/push-notifications/sending-notifications/)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)

