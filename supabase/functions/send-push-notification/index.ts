// Supabase Edge Function to send push notifications via Expo Push Notification Service
// Deploy with: supabase functions deploy send-push-notification
//
// If you deploy from Supabase Dashboard editor (no config.toml), call with anon key to avoid 401:
//   Authorization: Bearer YOUR_ANON_KEY
// (Get anon key from Dashboard → Settings → API. Safe for client-side; no user login required.)

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    let payload: { userIds?: unknown; userId?: unknown; user_id?: unknown; title?: string; body?: string; data?: object }
    try {
      const text = await req.text()
      payload = text ? JSON.parse(text) : {}
    } catch {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Request body must be valid JSON with userIds (array), title, and body',
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }
    const { title, body, data } = payload

    // Accept userIds (array), userId (single), or user_id (array or single)
    const rawIds = payload.userIds ?? payload.userId ?? payload.user_id
    const userIds = Array.isArray(rawIds) ? rawIds : rawIds != null ? [rawIds] : []

    if (userIds.length === 0) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'userIds must be a non-empty array. Send { "userIds": ["id1", "id2"], "title": "...", "body": "..." }',
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }
    
    if (!title || !body) {
      throw new Error('title and body are required')
    }
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
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

