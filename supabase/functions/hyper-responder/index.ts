// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Get Supabase environment variables
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    
    if (!supabaseUrl || !supabaseServiceKey) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Missing Supabase environment variables',
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Create Supabase client
    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey)

    // Calculate the date 2 days ago
    const twoDaysAgo = new Date()
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2)
    twoDaysAgo.setHours(0, 0, 0, 0) // Set to start of day for consistent comparison

    // Get all update logs for all assets with notification_type, ordered by most recent first
    // We need to find the most recent update for each asset that has a notification_type
    // Fetch full asset_logs data including all fields
    const { data: allUpdateLogs, error: logsError } = await supabaseClient
      .from('asset_logs')
      .select('*') // Get all fields from asset_logs
      .eq('action', 'updated')
      .not('notification_type', 'is', null) // Only get logs with notification_type
      .order('created_at', { ascending: false })

    if (logsError) {
      console.error('Error fetching asset logs:', logsError)
      throw logsError
    }

    // Group by asset_id and get the most recent update log for each asset
    // Store the full log data for assets updated at least 2 days ago
    const assetLastUpdateMap = new Map<string, any>()
    const assetLogsToReturn: any[] = []
    
    allUpdateLogs?.forEach((log: any) => {
      const logDate = new Date(log.created_at)
      
      // Only consider the most recent log for each asset
      if (!assetLastUpdateMap.has(log.asset_id)) {
        assetLastUpdateMap.set(log.asset_id, log)
        
        // If this log is at least 2 days old, add it to the return list
        if (logDate <= twoDaysAgo) {
          assetLogsToReturn.push(log)
        }
      }
    })

    // Create a simplified list for notification processing
    const assetsToNotify: Array<{ assetId: string; notificationType: string }> = []
    assetLogsToReturn.forEach((log) => {
      assetsToNotify.push({ 
        assetId: log.asset_id, 
        notificationType: log.notification_type 
      })
    })

    if (assetsToNotify.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          message: 'No assets were updated at least two days ago with notification types',
          assetLogs: [],
          notificationsCreated: 0,
          cutoffDate: twoDaysAgo.toISOString(),
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Fetch the actual assets to get their user_id (admin who created them)
    const assetIds = assetsToNotify.map(a => a.assetId)
    const { data: assets, error: assetsError } = await supabaseClient
      .from('assets')
      .select('id, asset_name, user_id')
      .in('id', assetIds)

    if (assetsError) {
      console.error('Error fetching assets:', assetsError)
      throw assetsError
    }

    if (!assets || assets.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          message: 'No assets found for the filtered asset IDs, but returning asset logs',
          assetLogs: assetLogsToReturn, // Still return the asset logs even if assets not found
          notificationsCreated: 0,
          cutoffDate: twoDaysAgo.toISOString(),
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Create a map of asset_id to notification_type
    const assetNotificationTypeMap = new Map<string, string>()
    assetsToNotify.forEach(({ assetId, notificationType }) => {
      assetNotificationTypeMap.set(assetId, notificationType)
    })

    // For each asset, find all users associated with it (users where userId matches asset.user_id)
    // Then create notifications for those users
    let notificationsCreated = 0
    const notificationErrors: string[] = []

    for (const asset of assets) {
      const notificationType = assetNotificationTypeMap.get(asset.id) || 'General Inspection'
      
      // Find all users where userId matches the asset's user_id (admin UUID)
      // This finds all regular users created by that admin
      // Note: asset.user_id is the UUID of the admin who created the asset
      // users.userId is the UUID field that points to the admin
      const { data: users, error: usersError } = await supabaseClient
        .from('users')
        .select('id')
        .eq('userId', asset.user_id)

      if (usersError) {
        console.error(`Error fetching users for asset ${asset.id}:`, usersError)
        notificationErrors.push(`Asset ${asset.id}: ${usersError.message}`)
        continue
      }

      if (!users || users.length === 0) {
        console.warn(`No users found for asset ${asset.id} with user_id ${asset.user_id}`)
        continue
      }

      // Check for existing notifications to avoid duplicates
      // Check if notifications already exist for these users and this asset within the last 24 hours
      const userIds = users.map(u => u.id)
      const oneDayAgo = new Date()
      oneDayAgo.setDate(oneDayAgo.getDate() - 1)
      
      const { data: existingNotifications, error: checkError } = await supabaseClient
        .from('notifications')
        .select('user_id, asset_id')
        .in('user_id', userIds)
        .eq('asset_id', asset.id)
        .eq('type', 'maintenance_reminder')
        .gte('created_at', oneDayAgo.toISOString())

      if (checkError) {
        console.warn(`Error checking existing notifications for asset ${asset.id}:`, checkError)
        // Continue anyway - we'll try to create notifications
      }

      // Filter out users who already have a notification for this asset
      const existingUserIds = new Set(
        existingNotifications?.map(n => n.user_id) || []
      )
      
      const usersToNotify = users.filter(user => !existingUserIds.has(user.id))

      if (usersToNotify.length === 0) {
        console.log(`All users already have notifications for asset ${asset.id}, skipping`)
        continue
      }

      // Create notifications for these users
      // Match the exact schema: user_id (integer), message (text), type (text), asset_id (uuid), read (boolean)
      // Note: id and created_at are auto-generated, so we don't include them
      const notificationData = usersToNotify.map(user => ({
        user_id: user.id, // INTEGER - user's id from users table
        message: `Maintenance reminder: ${asset.asset_name || 'Asset'} requires ${notificationType}`, // TEXT - required
        type: 'maintenance_reminder', // TEXT - required
        asset_id: asset.id, // UUID - nullable
        read: false, // BOOLEAN - defaults to false
      }))

      const { data: insertedNotifications, error: insertError } = await supabaseClient
        .from('notifications')
        .insert(notificationData)
        .select('id') // Return the inserted IDs to confirm insertion

      if (insertError) {
        console.error(`Error creating notifications for asset ${asset.id}:`, insertError)
        console.error('Notification data that failed:', JSON.stringify(notificationData, null, 2))
        notificationErrors.push(`Asset ${asset.id}: ${insertError.message}`)
      } else {
        const count = insertedNotifications?.length || notificationData.length
        notificationsCreated += count
        console.log(`Successfully created ${count} notifications for asset ${asset.id} (${asset.asset_name})`)
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Found ${assetLogsToReturn.length} asset logs updated at least two days ago. Created ${notificationsCreated} notifications.`,
        assetLogs: assetLogsToReturn, // Return the full asset logs data
        notificationsCreated,
        assetsProcessed: assets.length,
        cutoffDate: twoDaysAgo.toISOString(),
        errors: notificationErrors.length > 0 ? notificationErrors : undefined,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  } catch (error: any) {
    console.error('Error in hyper-responder function:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'An unexpected error occurred',
      }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})

/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/hyper-responder' \
    --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
    --header 'Content-Type: application/json' \
    --data '{}'

*/
