// Supabase Edge Function to send email notification when asset mileage exceeds 5000
// Deploy with: supabase functions deploy rapid-function

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

// HARD-CODED VALUES (env removed)
const SUPABASE_URL = "https://xejtgfdjfgrzauvztsod.supabase.co"
const SUPABASE_SERVICE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhlanRnZmRqZmdyemF1dnp0c29kIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTM5NjUwMywiZXhwIjoyMDgwOTcyNTAzfQ.b2DL520lbCZ6ZfcI7k5dEzfPYJYUjOadx7Tin14Qpe0"

const RESEND_API_KEY = "re_4ULDVA76_8SConbq58rSATRhAjd6LQXTW"
const FROM_EMAIL = "Fleet Management <noreply@yourdomain.com>"

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  try {
    // Parse request body
    const payload = await req.json()
    const { asset_id, asset_name, mileage, user_id, user_email } = payload

    // Validate required fields
    if (!asset_name || mileage === undefined) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "asset_name and mileage are required",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      )
    }

    // Only send email if mileage > 5000
    if (mileage <= 5000) {
      return new Response(
        JSON.stringify({
          success: true,
          message: "Mileage is not above 5000, no email sent",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    // Get user information if user_id is provided
    let email = user_email
    let firstName = "User"

    if (user_id && !email) {
      const supabaseClient = createClient(
        SUPABASE_URL,
        SUPABASE_SERVICE_KEY
      )

      try {
        // Try to fetch user - handle both UUID and numeric IDs
        const { data: user, error: userError } = await supabaseClient
          .from("users")
          .select("email, first_name, last_name")
          .eq("id", user_id)
          .single()

        if (userError) {
          console.error("Error fetching user:", userError)
          // If it's a UUID format error, try as numeric ID
          if (userError.message?.includes("invalid input syntax") && typeof user_id === "string") {
            const numericId = parseInt(user_id, 10)
            if (!isNaN(numericId)) {
              const { data: userByNumericId, error: numericError } = await supabaseClient
                .from("users")
                .select("email, first_name, last_name")
                .eq("id", numericId)
                .single()
              
              if (!numericError && userByNumericId) {
                email = userByNumericId.email || email
                firstName = userByNumericId.first_name || firstName
              }
            }
          }
          // Continue with provided email or skip if no user found
        } else if (user) {
          email = user.email || email
          firstName = user.first_name || firstName
        }
      } catch (fetchError) {
        console.error("Exception fetching user:", fetchError)
        // Continue with provided email or skip
      }
    }

    // If no email available, return error
    if (!email) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "No email address available for user",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      )
    }

    // Send email via Resend
    const html = `
      <h2>Asset Mileage Alert</h2>
      <p>Dear ${firstName},</p>
      <p>Your asset <strong>${asset_name}</strong> has exceeded 5,000 miles.</p>
      <p><strong>Current Mileage:</strong> ${mileage} miles</p>
      <p>Please schedule maintenance for this asset.</p>
    `

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: [email],
        subject: "Asset Mileage Alert",
        html,
      }),
    })

    const json = await res.json()

    return new Response(
      JSON.stringify({
        success: res.ok,
        emailSent: res.ok,
        email,
        assetName: asset_name,
        mileage,
        response: json,
      }),
      {
        status: res.ok ? 200 : 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    )
  } catch (err: any) {
    return new Response(
      JSON.stringify({
        success: false,
        error: err.message || "An unexpected error occurred",
      }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    )
  }
})

