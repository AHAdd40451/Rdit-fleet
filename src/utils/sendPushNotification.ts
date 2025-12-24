/**
 * Utility functions for sending push notifications via Expo Push Notification Service
 * 
 * This file contains helper functions that can be used in your backend/server
 * to send push notifications to users. You'll need to call these from your
 * Supabase Edge Functions, API routes, or backend services.
 * 
 * Example usage in a Supabase Edge Function or API route:
 * 
 * import { sendPushNotification } from './sendPushNotification';
 * 
 * // Send to a single user
 * await sendPushNotification(userId, {
 *   title: 'New Asset Created',
 *   body: 'A new asset has been added to your fleet',
 *   data: { type: 'asset_created', asset_id: '123' }
 * });
 * 
 * // Send to multiple users
 * await sendPushNotification([userId1, userId2], {
 *   title: 'Maintenance Reminder',
 *   body: 'Your vehicle needs maintenance',
 *   data: { type: 'maintenance_reminder' }
 * });
 */

import { supabase } from '../../lib/supabase';

export interface PushNotificationPayload {
  title: string;
  body: string;
  data?: Record<string, any>;
  sound?: 'default' | null;
  badge?: number;
  priority?: 'default' | 'normal' | 'high';
}

/**
 * Fetches push tokens for a user or array of users from Supabase
 */
async function getPushTokensForUsers(userIds: number | number[]): Promise<string[]> {
  const userIdArray = Array.isArray(userIds) ? userIds : [userIds];
  
  const { data, error } = await supabase
    .from('push_tokens')
    .select('token')
    .in('user_id', userIdArray);

  if (error) {
    console.error('Error fetching push tokens:', error);
    return [];
  }

  return data?.map(item => item.token) || [];
}

/**
 * Sends a push notification to one or more users
 * 
 * This function should be called from your backend/server, not from the mobile app.
 * For sending from Supabase, you can create an Edge Function or use a database trigger.
 * 
 * @param userIds - Single user ID or array of user IDs
 * @param payload - The notification payload
 * @returns Promise<boolean> - Returns true if notification was sent successfully
 */
export async function sendPushNotification(
  userIds: number | number[],
  payload: PushNotificationPayload
): Promise<boolean> {
  try {
    // Get push tokens for the users
    const tokens = await getPushTokensForUsers(userIds);
    
    if (tokens.length === 0) {
      console.warn('No push tokens found for users:', userIds);
      return false;
    }

    // Send notifications via Expo Push Notification Service
    const messages = tokens.map(token => ({
      to: token,
      sound: payload.sound || 'default',
      title: payload.title,
      body: payload.body,
      data: payload.data || {},
      badge: payload.badge,
      priority: payload.priority || 'high',
    }));

    // Call Expo Push Notification API
    const response = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Accept-Encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(messages),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error sending push notification:', errorText);
      return false;
    }

    const result = await response.json();
    console.log('Push notification sent:', result);
    return true;
  } catch (error) {
    console.error('Unexpected error sending push notification:', error);
    return false;
  }
}

/**
 * Example: Send notification when an asset is created
 * This would typically be called from a Supabase database trigger or Edge Function
 */
export async function notifyAssetCreated(
  userIds: number | number[],
  assetId: string,
  assetName: string
): Promise<boolean> {
  return sendPushNotification(userIds, {
    title: 'New Asset Created',
    body: `${assetName} has been added to your fleet`,
    data: {
      type: 'asset_created',
      asset_id: assetId,
    },
    priority: 'high',
  });
}

/**
 * Example: Send maintenance reminder notification
 */
export async function notifyMaintenanceReminder(
  userIds: number | number[],
  assetName: string
): Promise<boolean> {
  return sendPushNotification(userIds, {
    title: 'Maintenance Reminder',
    body: `${assetName} is due for maintenance`,
    data: {
      type: 'maintenance_reminder',
    },
    priority: 'high',
  });
}

