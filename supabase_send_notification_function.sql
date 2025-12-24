-- Example Supabase Database Functions and Edge Functions to send push notifications
-- This is a reference implementation showing how to send push notifications from Supabase

-- IMPORTANT: Supabase PostgreSQL does not support the http extension for making HTTP requests.
-- Use Supabase Edge Functions (recommended) or call an external API from your backend instead.

-- Option 1: Create a trigger function that stores notification data
-- This function can be called from triggers and will store notification requests
-- You'll need to process these via Edge Functions or an external service
CREATE OR REPLACE FUNCTION queue_push_notification(
  p_user_ids INTEGER[],
  p_title TEXT,
  p_body TEXT,
  p_data JSONB DEFAULT '{}'::JSONB
)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
BEGIN
  -- Store notification request in a queue table (create this table if needed)
  -- CREATE TABLE IF NOT EXISTS notification_queue (
  --   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  --   user_ids INTEGER[] NOT NULL,
  --   title TEXT NOT NULL,
  --   body TEXT NOT NULL,
  --   data JSONB DEFAULT '{}'::JSONB,
  --   created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  --   processed BOOLEAN DEFAULT FALSE
  -- );
  
  -- INSERT INTO notification_queue (user_ids, title, body, data)
  -- VALUES (p_user_ids, p_title, p_body, p_data);
  
  -- For now, just log (you'll process via Edge Function)
  RAISE NOTICE 'Notification queued for users: %, title: %, body: %', 
    p_user_ids, p_title, p_body;
  
  RETURN TRUE;
END;
$$;

-- Example trigger function that queues notification when asset is created
-- This creates a notification record that can be processed by Edge Functions
CREATE OR REPLACE FUNCTION notify_users_on_asset_created()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_company_id INTEGER;
  v_user_ids INTEGER[];
BEGIN
  -- Get company_id from the asset (adjust based on your schema)
  -- v_company_id := NEW.company_id;
  
  -- Get all user IDs for this company (or all users if no company filter)
  SELECT ARRAY_AGG(id) INTO v_user_ids
  FROM users
  WHERE role = 'user';
  -- Add company filter if needed: AND company_id = v_company_id;
  
  -- Queue notification (will be processed by Edge Function)
  IF v_user_ids IS NOT NULL AND array_length(v_user_ids, 1) > 0 THEN
    PERFORM queue_push_notification(
      v_user_ids,
      'New Asset Created',
      COALESCE(NEW.name, 'A new asset') || ' has been added to your fleet',
      jsonb_build_object(
        'type', 'asset_created',
        'asset_id', NEW.id::TEXT,
        'asset_name', COALESCE(NEW.name, 'Unknown')
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger to automatically queue notification when asset is created
-- Uncomment and modify based on your assets table structure:
-- CREATE TRIGGER asset_created_notification
--   AFTER INSERT ON assets
--   FOR EACH ROW
--   EXECUTE FUNCTION notify_users_on_asset_created();

-- ============================================================================
-- RECOMMENDED: Use Supabase Edge Functions (Deno)
-- ============================================================================
-- Supabase PostgreSQL does not support HTTP requests directly.
-- Use Edge Functions for sending push notifications.

-- Step 1: Create the Edge Function
-- Create a file: supabase/functions/send-push-notification/index.ts

/*
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  try {
    const { userIds, title, body, data } = await req.json()
    
    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      throw new Error('userIds must be a non-empty array')
    }
    
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )
    
    // Get push tokens for the users
    const { data: tokens, error } = await supabaseClient
      .from('push_tokens')
      .select('token')
      .in('user_id', userIds)
    
    if (error) throw error
    
    if (!tokens || tokens.length === 0) {
      return new Response(
        JSON.stringify({ success: false, message: 'No push tokens found' }),
        { headers: { 'Content-Type': 'application/json' } }
      )
    }
    
    // Send via Expo Push Notification Service
    const messages = tokens.map(token => ({
      to: token.token,
      sound: 'default',
      title,
      body,
      data: data || {},
      priority: 'high',
    }))
    
    const response = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Accept-Encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(messages),
    })
    
    const result = await response.json()
    
    return new Response(
      JSON.stringify({ 
        success: response.ok, 
        result,
        tokensSent: tokens.length 
      }),
      {
        headers: { 'Content-Type': 'application/json' },
      }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  }
})
*/

-- Step 2: Deploy the Edge Function
-- Run: supabase functions deploy send-push-notification

-- Step 3: Call the Edge Function from your app or database trigger
-- Example: Call from your app code:
/*
const { data, error } = await supabase.functions.invoke('send-push-notification', {
  body: {
    userIds: [1, 2, 3],
    title: 'New Asset Created',
    body: 'A new asset has been added to your fleet',
    data: { type: 'asset_created', asset_id: '123' }
  }
})
*/

-- Step 4: Optional - Create a database function to call the Edge Function via pg_net
-- Note: This requires pg_net extension (check if available in your Supabase instance)
/*
CREATE OR REPLACE FUNCTION send_push_notification_via_edge_function(
  p_user_ids INTEGER[],
  p_title TEXT,
  p_body TEXT,
  p_data JSONB DEFAULT '{}'::JSONB
)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
DECLARE
  v_response TEXT;
BEGIN
  -- Call the Edge Function via HTTP (if pg_net is available)
  -- This is an alternative approach if you want to trigger from SQL
  
  -- Note: You'll need to set up the Edge Function URL
  -- Get it from: Supabase Dashboard > Edge Functions > send-push-notification
  
  PERFORM net.http_post(
    url := 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/send-push-notification',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
    ),
    body := jsonb_build_object(
      'userIds', p_user_ids,
      'title', p_title,
      'body', p_body,
      'data', p_data
    )
  );
  
  RETURN TRUE;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Failed to call Edge Function: %', SQLERRM;
    RETURN FALSE;
END;
$$;
*/

