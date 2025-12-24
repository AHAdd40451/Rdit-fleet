// Supabase Edge Function to send push notifications via Expo Push Notification Service
// Deploy with: supabase functions deploy send-push-notification

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { userIds, title, body, data } = await req.json()
    
    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      throw new Error('userIds must be a non-empty array')
    }
    
    if (!title || !body) {
      throw new Error('title and body are required')
    }
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase environment variables')
    }
    
    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey)
    
    // Get push tokens for the users
    const { data: tokens, error } = await supabaseClient
      .from('push_tokens')
      .select('token')
      .in('user_id', userIds)
    
    if (error) {
      console.error('Error fetching push tokens:', error)
      throw error
    }
    
    if (!tokens || tokens.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: 'No push tokens found for the specified users',
          userIds 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 // Still return 200 as this is not an error
        }
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
    
    const expoResponse = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Accept-Encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(messages),
    })
    
    const expoResult = await expoResponse.json()
    
    // Handle Expo API response
    // Expo returns an array of results, one per message
    const hasErrors = Array.isArray(expoResult) && 
      expoResult.some((result: any) => result.status === 'error')
    
    return new Response(
      JSON.stringify({ 
        success: expoResponse.ok && !hasErrors,
        expoResponse: expoResult,
        tokensSent: tokens.length,
        messagesCount: messages.length
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  } catch (error) {
    console.error('Error in send-push-notification function:', error)
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message || 'Unknown error occurred'
      }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})

