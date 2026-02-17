// Supabase Edge Function to create a Stripe PaymentIntent (server-side only).
// Deploy: supabase functions deploy create-payment-intent
// Set secret: supabase secrets set STRIPE_SECRET_KEY=sk_test_...
//
// POST body: { "amount": 1999, "currency": "usd" }  (amount in cents)

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import Stripe from 'https://esm.sh/stripe@14?target=denonext';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method === 'GET') {
    return new Response(
      JSON.stringify({
        message: 'Create a Stripe PaymentIntent by sending POST with JSON body: { "amount": 1999, "currency": "usd" } (amount in cents)',
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed. Use POST with JSON body: { amount, currency? }' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');
  if (!stripeSecretKey) {
    console.error('STRIPE_SECRET_KEY is not set');
    return new Response(
      JSON.stringify({ error: 'Server configuration error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  const stripe = new Stripe(stripeSecretKey, { apiVersion: '2024-11-20.acacia' });

  try {
    const body = await req.json().catch(() => ({}));
    const amount = typeof body.amount === 'number' ? Math.round(body.amount) : 0;
    const currency = (typeof body.currency === 'string' && body.currency.length === 3)
      ? body.currency.toLowerCase()
      : 'usd';

    if (amount < 50) {
      return new Response(
        JSON.stringify({ error: 'Amount must be at least 50 (cents)' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency,
      automatic_payment_methods: { enabled: true },
    });

    return new Response(
      JSON.stringify({ clientSecret: paymentIntent.client_secret }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('Stripe error:', message);
    return new Response(
      JSON.stringify({ error: message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
