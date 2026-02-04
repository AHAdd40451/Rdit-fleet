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

    // Get current date/time for comparison
    const now = new Date()

    // Get asset_id from request body, or use default
    let requestBody: any = {}
    try {
      requestBody = await req.json()
    } catch {
      // If no body or invalid JSON, use empty object
    }
    
    // Use asset_id from request body, or default to the specific asset
    const targetAssetId = requestBody.asset_id || 'd5efced0-102d-4611-b546-c5b5c505999c'

    // Get reminders for the specific asset where reminder_date has passed (reminder_date <= now)
    const { data: dueReminders, error: remindersError } = await supabaseClient
      .from('reminders')
      .select('*')
      .eq('asset_id', targetAssetId)
      .lte('reminder_date', now.toISOString())

    if (remindersError) {
      console.error('Error fetching reminders:', remindersError)
      throw remindersError
    }

    if (!dueReminders || dueReminders.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          message: `No reminders are due at this time for asset ${targetAssetId}`,
          assetId: targetAssetId,
          reminders: [],
          notificationsCreated: 0,
          currentTime: now.toISOString(),
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Fetch the actual assets to get their user_id (admin who created them), asset_name, and reminders JSON
    // Get unique asset IDs from all due reminders
    const assetIds = [...new Set(dueReminders.map((r: any) => r.asset_id))]
    const { data: assets, error: assetsError } = await supabaseClient
      .from('assets')
      .select('id, asset_name, user_id, reminders')
      .in('id', assetIds)

    if (assetsError) {
      console.error('Error fetching assets:', assetsError)
      throw assetsError
    }

    if (!assets || assets.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          message: 'No assets found for the due reminders',
          reminders: dueReminders,
          notificationsCreated: 0,
          currentTime: now.toISOString(),
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Create a map of asset_id to asset data for quick lookup
    const assetsMap = new Map<string, any>()
    assets.forEach((asset: any) => {
      assetsMap.set(asset.id, asset)
    })

    // Process each reminder individually to allow different reminder types to create different notifications
    let notificationsCreated = 0
    const notificationErrors: string[] = []
    const processedReminders: any[] = []
    const diagnosticInfo: any[] = []

    for (const reminder of dueReminders) {
      const asset = assetsMap.get(reminder.asset_id)
      
      if (!asset) {
        diagnosticInfo.push({
          assetId: reminder.asset_id,
          reminderId: reminder.id,
          issue: 'Asset not found for this reminder'
        })
        continue
      }

      console.log(`Processing reminder ${reminder.id} for asset ${asset.id}, reminder_type: ${reminder.reminder_type}, assigned_id: ${reminder.assigned_id}`)

      // Parse asset's reminders JSON to check lastUpdate dates
      let assetReminders: any = {}
      try {
        if (asset.reminders) {
          assetReminders = typeof asset.reminders === 'string' 
            ? JSON.parse(asset.reminders) 
            : asset.reminders
        }
      } catch (parseError) {
        console.warn(`Error parsing reminders JSON for asset ${asset.id}:`, parseError)
      }

      // Check if reminder_type is an array (new schema) or string (old schema)
      const reminderTypes = Array.isArray(reminder.reminder_type) 
        ? reminder.reminder_type 
        : [reminder.reminder_type]

      // Check which reminder types need notifications based on lastUpdate vs reminder_date
      const reminderDate = new Date(reminder.reminder_date)
      const typesNeedingNotification: string[] = []

      // Mapping from display names to JSON keys (snake_case)
      const typeToKeyMap: { [key: string]: string } = {
        'Oil Change': 'oil_change',
        'Tire Rotation / Replacement': 'tire_rotation',
        'General Inspection': 'general_inspection',
        'Fluids': 'fluids',
        'Belts': 'belts',
        'Lights': 'lights',
        'Battery': 'battery',
        'Brake Inspection': 'brake_inspection',
        'Compliance Inspection (DOT, State, CDL-related)': 'compliance_inspection',
        'Custom (Admin-created)': 'custom',
      }

      for (const type of reminderTypes) {
        // Get the JSON key for this reminder type
        const jsonKey = typeToKeyMap[type] || type.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '')
        
        const reminderData = assetReminders[jsonKey]
        const lastUpdate = reminderData?.lastUpdate ? new Date(reminderData.lastUpdate) : null

        // Create notification if:
        // 1. lastUpdate doesn't exist (maintenance never done), OR
        // 2. lastUpdate exists but is before reminder_date (maintenance done before it was due, now it's due again)
        if (!lastUpdate || lastUpdate < reminderDate) {
          typesNeedingNotification.push(type)
        } else {
          console.log(`Reminder type "${type}" (key: ${jsonKey}) was last updated on ${lastUpdate.toISOString()}, which is after the scheduled date ${reminderDate.toISOString()}, skipping notification`)
        }
      }

      // Skip if no types need notification
      if (typesNeedingNotification.length === 0) {
        console.log(`All reminder types for reminder ${reminder.id} (asset ${asset.id}) have been updated after the scheduled date, skipping`)
        diagnosticInfo.push({
          assetId: asset.id,
          reminderId: reminder.id,
          reminderTypes: reminderTypes,
          issue: 'All types already updated after scheduled date',
          reminderDate: reminder.reminder_date
        })
        continue
      }

      // Find the user assigned to this reminder (assigned_id is the UUID of the admin)
      // If assigned_id is null, use the asset's user_id (admin who created the asset)
      const assignedId = reminder.assigned_id || asset.user_id
      
      if (!assignedId) {
        console.warn(`No assigned_id or user_id found for reminder ${reminder.id} (asset ${asset.id}), skipping`)
        diagnosticInfo.push({
          assetId: asset.id,
          reminderId: reminder.id,
          issue: 'No assigned_id or user_id found',
        })
        continue
      }

      // Find all regular users created by that admin
      const { data: users, error: usersError } = await supabaseClient
        .from('users')
        .select('id')
        .eq('userId', assignedId)

      if (usersError) {
        console.error(`Error fetching users for reminder ${reminder.id} (asset ${asset.id}):`, usersError)
        notificationErrors.push(`Reminder ${reminder.id}: ${usersError.message}`)
        diagnosticInfo.push({
          assetId: asset.id,
          reminderId: reminder.id,
          issue: 'Error fetching users',
          error: usersError.message
        })
        continue
      }

      if (!users || users.length === 0) {
        console.warn(`No users found for reminder ${reminder.id} with assigned_id ${assignedId}`)
        diagnosticInfo.push({
          assetId: asset.id,
          reminderId: reminder.id,
          issue: 'No users found',
          assignedId: assignedId,
          message: `No users found with userId matching ${assignedId}`
        })
        continue
      }

      console.log(`Found ${users.length} users for reminder ${reminder.id}`)
      console.log(`Types needing notification: ${typesNeedingNotification.join(', ')}`)

      const userIds = users.map((u: any) => u.id)
      const intervalDays = reminder.interval_days || 0

      // Get all notifications for this reminder (not just last 24 hours) to check interval logic
      const { data: allNotifications, error: checkError } = await supabaseClient
        .from('notifications')
        .select('user_id, asset_id, message, created_at')
        .in('user_id', userIds)
        .eq('asset_id', asset.id)
        .eq('type', 'maintenance_reminder')
        .gte('created_at', reminder.reminder_date) // Only check notifications created after the reminder was scheduled

      if (checkError) {
        console.warn(`Error checking existing notifications for reminder ${reminder.id}:`, checkError)
        // Continue anyway - we'll try to create notifications
      }

      // Filter notifications that match any of the reminder types needing notification
      const matchingNotifications = (allNotifications || []).filter(
        (n: any) => n.message && typesNeedingNotification.some(
          type => n.message.includes(type)
        )
      )

      // Determine which users should receive notifications based on interval logic
      const usersToNotify: any[] = []

      for (const user of users) {
        // Get all notifications for this specific user for this reminder
        const userNotifications = matchingNotifications.filter(
          (n: any) => n.user_id === user.id
        )

        if (intervalDays === 0) {
          // One-time reminder: only create if no notification exists
          if (userNotifications.length === 0) {
            usersToNotify.push(user)
          }
        } else {
          // Interval-based reminder: check if we need to create another notification
          if (userNotifications.length === 0) {
            // No notifications yet, create the first one
            usersToNotify.push(user)
          } else {
            // Check the last notification date
            const sortedNotifications = userNotifications.sort(
              (a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
            )
            const lastNotification = sortedNotifications[0]
            const lastNotificationDate = new Date(lastNotification.created_at)
            
            // Calculate days since last notification
            const daysSinceLastNotification = Math.floor(
              (now.getTime() - lastNotificationDate.getTime()) / (1000 * 60 * 60 * 24)
            )

            // Check if we've created fewer notifications than the interval allows
            // and if it's been at least 1 day since the last notification
            if (userNotifications.length < intervalDays && daysSinceLastNotification >= 1) {
              usersToNotify.push(user)
            }
          }
        }
      }

      if (usersToNotify.length === 0) {
        console.log(`No users need notifications for reminder ${reminder.id} (asset ${asset.id}, reminder_types: ${typesNeedingNotification.join(', ')}, interval: ${intervalDays}), skipping`)
        diagnosticInfo.push({
          assetId: asset.id,
          reminderId: reminder.id,
          reminderTypes: typesNeedingNotification,
          intervalDays: intervalDays,
          issue: 'No users need notifications at this time',
          totalUsers: users.length,
          existingNotifications: matchingNotifications.length
        })
        continue
      }

      console.log(`Creating notifications for ${usersToNotify.length} users for reminder ${reminder.id} (asset ${asset.id}, reminder_types: ${typesNeedingNotification.join(', ')}, interval: ${intervalDays})`)

      // Create notifications for these users - one notification per reminder type that needs attention
      // Match the exact schema: user_id (integer), message (text), type (text), asset_id (uuid), read (boolean)
      // Note: id and created_at are auto-generated, so we don't include them
      const notificationData: any[] = []
      
      for (const type of typesNeedingNotification) {
        for (const user of usersToNotify) {
          notificationData.push({
            user_id: user.id, // INTEGER - user's id from users table
            message: `Maintenance reminder: ${asset.asset_name || 'Asset'} requires ${type}`, // TEXT - required, includes reminder_type
            type: 'maintenance_reminder', // TEXT - required
            asset_id: asset.id, // UUID - nullable
            read: false, // BOOLEAN - defaults to false
          })
        }
      }

      const { data: insertedNotifications, error: insertError } = await supabaseClient
        .from('notifications')
        .insert(notificationData)
        .select('id') // Return the inserted IDs to confirm insertion

      if (insertError) {
        console.error(`Error creating notifications for reminder ${reminder.id} (asset ${asset.id}):`, insertError)
        console.error('Notification data that failed:', JSON.stringify(notificationData, null, 2))
        notificationErrors.push(`Reminder ${reminder.id}: ${insertError.message}`)
        diagnosticInfo.push({
          assetId: asset.id,
          reminderId: reminder.id,
          reminderTypes: typesNeedingNotification,
          issue: 'Insert error',
          error: insertError.message,
          notificationDataCount: notificationData.length
        })
      } else {
        const count = insertedNotifications?.length || notificationData.length
        notificationsCreated += count
        processedReminders.push(reminder)
        console.log(`Successfully created ${count} notifications for reminder ${reminder.id} (asset ${asset.id}, ${asset.asset_name}, reminder_types: ${typesNeedingNotification.join(', ')})`)

        // Send push notifications to users' devices
        const userIds = usersToNotify.map((u: { id: number }) => u.id)
        if (userIds.length > 0) {
          try {
            const pushUrl = `${supabaseUrl}/functions/v1/send-push-notification`
            const pushRes = await fetch(pushUrl, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${supabaseServiceKey}`,
              },
              body: JSON.stringify({
                userIds,
                title: 'Maintenance Reminder',
                body: `Maintenance reminder: ${asset.asset_name || 'Asset'} requires ${typesNeedingNotification.join(', ')}`,
                data: { type: 'maintenance_reminder', asset_id: asset.id },
              }),
            })
            if (!pushRes.ok) {
              console.warn('send-push-notification responded with', pushRes.status, await pushRes.text())
            }
          } catch (pushErr) {
            console.warn('Error calling send-push-notification:', pushErr)
          }
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Found ${dueReminders.length} reminders that are due for asset ${targetAssetId}. Created ${notificationsCreated} notifications.`,
        assetId: targetAssetId,
        reminders: processedReminders, // Return the processed reminders
        totalDueReminders: dueReminders.length,
        notificationsCreated,
        assetsProcessed: assets.length,
        currentTime: now.toISOString(),
        errors: notificationErrors.length > 0 ? notificationErrors : undefined,
        diagnostic: diagnosticInfo.length > 0 ? diagnosticInfo : undefined, // Add diagnostic info
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
