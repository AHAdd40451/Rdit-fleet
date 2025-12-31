/**
 * Utility function to call the rapid-function edge function
 * This function sends an email when an asset's mileage is above 5000
 */

import { supabase } from '../../lib/supabase';
import Constants from 'expo-constants';

const SUPABASE_URL = Constants.expoConfig?.extra?.supabaseUrl || 'https://xejtgfdjfgrzauvztsod.supabase.co';
const EDGE_FUNCTION_URL = `${SUPABASE_URL}/functions/v1/rapid-function`;

export interface RapidFunctionPayload {
  asset_id?: string;
  asset_name?: string;
  mileage?: number;
  user_id?: string;
  user_email?: string;
  [key: string]: any;
}

/**
 * Calls the rapid-function edge function to send email notification
 * @param payload - The data to send to the edge function
 * @returns Promise<boolean> - Returns true if the function was called successfully
 */
export async function callRapidFunction(payload: RapidFunctionPayload): Promise<boolean> {
  try {
    // Get the current session to include auth token
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error('Error getting session for edge function call:', sessionError);
      // Continue anyway - the edge function might not require auth
    }

    // Prepare headers
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    // Add authorization header if we have a session
    if (session?.access_token) {
      headers['Authorization'] = `Bearer ${session.access_token}`;
    }

    // Call the edge function
    const response = await fetch(EDGE_FUNCTION_URL, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error calling rapid-function:', errorText);
      return false;
    }

    const result = await response.json();
    console.log('Rapid function called successfully:', result);
    return true;
  } catch (error) {
    console.error('Unexpected error calling rapid-function:', error);
    return false;
  }
}

