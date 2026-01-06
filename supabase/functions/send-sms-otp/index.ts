import { serve } from "https://deno.land/std/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req:any) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  let phone;
  try {
    const body = await req.json();
    phone = body.phone;
  } catch (err) {
    return new Response(
      JSON.stringify({ success: false, error: 'Invalid JSON in request body' }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }

  if (!phone) {
    return new Response(
      JSON.stringify({ success: false, error: 'Phone required' }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }

  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  try {
    // Send SMS via Telnyx
    const telnyxRes = await fetch(
      "https://api.telnyx.com/v2/messages",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer KEY019B0E668C8C3E18098C46D69E681810`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "+14079872496",
          to: phone,
          text: `Your OTP is ${otp}`,
        }),
      }
    );

    if (!telnyxRes.ok) {
      const err = await telnyxRes.text();
      console.error('Telnyx API error:', err);
      throw new Error(`Telnyx API error: ${err}`);
    }

    // Save OTP in Supabase
    const supabaseUrl = "https://xejtgfdjfgrzauvztsod.supabase.co";
    const serviceKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhlanRnZmRqZmdyemF1dnp0c29kIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTM5NjUwMywiZXhwIjoyMDgwOTcyNTAzfQ.b2DL520lbCZ6ZfcI7k5dEzfPYJYUjOadx7Tin14Qpe0";

    // Format expires_at as ISO string for Supabase
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();
    
    const supabaseRes = await fetch(`${supabaseUrl}/rest/v1/otp_codes`, {
      method: "POST",
      headers: {
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
        "Content-Type": "application/json",
        "Prefer": "return=minimal",
      },
      body: JSON.stringify({
        phone,
        otp,
        expires_at: expiresAt,
      }),
    });

    if (!supabaseRes.ok) {
      const errText = await supabaseRes.text();
      console.error('Supabase insert error:', errText);
      throw new Error(`Failed to save OTP: ${errText}`);
    }

    return new Response(
      JSON.stringify({ success: true }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );

  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    const errorStack = err instanceof Error ? err.stack : undefined;
    console.error('Error in send-sms-otp function:', {
      message: errorMessage,
      stack: errorStack,
      phone: phone,
    });
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: errorMessage,
        details: process.env.DENO_ENV === 'development' ? errorStack : undefined
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  }
});
