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
    // First, check if the token already exists (token has UNIQUE constraint)
    const { data: existingTokenByToken, error: tokenCheckError } = await supabase
      .from('push_tokens')
      .select('id, user_id, token, platform')
      .eq('token', tokenData.token)
      .maybeSingle();

    if (tokenCheckError && tokenCheckError.code !== 'PGRST116') {
      // PGRST116 is "not found" which is fine
      console.error('Error checking existing token:', tokenCheckError);
      return false;
    }

    if (existingTokenByToken) {
      // Token exists - update it (even if user_id changed, token is unique per device)
      const { error: updateError } = await supabase
        .from('push_tokens')
        .update({
          user_id: userId,
          device_id: tokenData.deviceId,
          platform: tokenData.platform,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingTokenByToken.id);

      if (updateError) {
        console.error('Error updating push token:', updateError);
        return false;
      }
      console.log('Push token updated successfully');
      return true;
    }

    // Token doesn't exist - check if user already has a token for this platform
    const { data: existingTokenByUser, error: userCheckError } = await supabase
      .from('push_tokens')
      .select('id, token')
      .eq('user_id', userId)
      .eq('platform', tokenData.platform)
      .maybeSingle();

    if (userCheckError && userCheckError.code !== 'PGRST116') {
      console.error('Error checking user token:', userCheckError);
      return false;
    }

    if (existingTokenByUser) {
      // User has a token for this platform but it's different - update it
      const { error: updateError } = await supabase
        .from('push_tokens')
        .update({
          token: tokenData.token,
          device_id: tokenData.deviceId,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingTokenByUser.id);

      if (updateError) {
        console.error('Error updating push token:', updateError);
        return false;
      }
      console.log('Push token updated successfully');
      return true;
    }

    // No existing token - insert new one
    const { error: insertError } = await supabase
      .from('push_tokens')
      .insert({
        user_id: userId,
        token: tokenData.token,
        device_id: tokenData.deviceId,
        platform: tokenData.platform,
      });

    if (insertError) {
      // If insert fails due to duplicate (race condition), try to update instead
      if (insertError.code === '23505') {
        // Duplicate key error - token was inserted between our check and insert
        const { error: updateError } = await supabase
          .from('push_tokens')
          .update({
            user_id: userId,
            device_id: tokenData.deviceId,
            platform: tokenData.platform,
            updated_at: new Date().toISOString(),
          })
          .eq('token', tokenData.token);

        if (updateError) {
          console.error('Error updating push token after duplicate:', updateError);
          return false;
        }
        console.log('Push token updated successfully (handled duplicate)');
        return true;
      }
      console.error('Error saving push token:', insertError);
      return false;
    }
    console.log('Push token saved successfully');
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

