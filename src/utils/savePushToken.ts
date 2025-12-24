import { supabase } from '../../lib/supabase';
import { PushTokenData } from './registerForPushNotifications';

/**
 * Saves or updates a push token for a user in Supabase
 * @param userId - The user ID from the users table
 * @param tokenData - The push token data including token, deviceId, and platform
 */
export async function savePushTokenToSupabase(
  userId: number,
  tokenData: PushTokenData
): Promise<boolean> {
  try {
    // Check if token already exists for this user
    const { data: existingToken, error: checkError } = await supabase
      .from('push_tokens')
      .select('id, token')
      .eq('user_id', userId)
      .eq('platform', tokenData.platform)
      .maybeSingle();

    if (checkError && checkError.code !== 'PGRST116') {
      // PGRST116 is "not found" which is fine
      console.error('Error checking existing token:', checkError);
      return false;
    }

    if (existingToken) {
      // Update existing token if it's different
      if (existingToken.token !== tokenData.token) {
        const { error: updateError } = await supabase
          .from('push_tokens')
          .update({
            token: tokenData.token,
            device_id: tokenData.deviceId,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existingToken.id);

        if (updateError) {
          console.error('Error updating push token:', updateError);
          return false;
        }
        console.log('Push token updated successfully');
      }
    } else {
      // Insert new token
      const { error: insertError } = await supabase
        .from('push_tokens')
        .insert({
          user_id: userId,
          token: tokenData.token,
          device_id: tokenData.deviceId,
          platform: tokenData.platform,
        });

      if (insertError) {
        console.error('Error saving push token:', insertError);
        return false;
      }
      console.log('Push token saved successfully');
    }

    return true;
  } catch (error) {
    console.error('Unexpected error saving push token:', error);
    return false;
  }
}

/**
 * Removes a push token when user logs out
 * @param userId - The user ID from the users table
 * @param token - Optional specific token to remove, otherwise removes all tokens for user
 */
export async function removePushTokenFromSupabase(
  userId: number,
  token?: string
): Promise<boolean> {
  try {
    let query = supabase.from('push_tokens').delete().eq('user_id', userId);

    if (token) {
      query = query.eq('token', token);
    }

    const { error } = await query;

    if (error) {
      console.error('Error removing push token:', error);
      return false;
    }

    console.log('Push token(s) removed successfully');
    return true;
  } catch (error) {
    console.error('Unexpected error removing push token:', error);
    return false;
  }
}

