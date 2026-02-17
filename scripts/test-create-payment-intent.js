/**
 * Test script for create-payment-intent Edge Function.
 * Usage: node scripts/test-create-payment-intent.js [amount] [currency]
 *
 * Examples:
 *   node scripts/test-create-payment-intent.js
 *   node scripts/test-create-payment-intent.js 1999
 *   node scripts/test-create-payment-intent.js 5000 usd
 *
 * Set env vars (or create .env and use dotenv):
 *   SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
 *   SUPABASE_ANON_KEY=your_anon_key
 */

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://xejtgfdjfgrzauvztsod.supabase.co';
const SUPABASE_ANON_KEY =
  process.env.SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhlanRnZmRqZmdyemF1dnp0c29kIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUzOTY1MDMsImV4cCI6MjA4MDk3MjUwM30.CWBmGhPxHF0CC68M1TReTWJMu6tWYFqic1FaYT5jdAs';

const FUNCTION_URL = `${SUPABASE_URL}/functions/v1/create-payment-intent`;

// amount in cents (default 1999 = $19.99), currency from args or default "usd"
const amountCents = parseInt(process.argv[2], 10) || 1999;
const currency = (process.argv[3] || 'usd').toLowerCase();

const payload = { amount: amountCents, currency };

async function main() {
  if (!SUPABASE_ANON_KEY) {
    console.error('Set SUPABASE_ANON_KEY (env or .env). Get it from Dashboard → Settings → API.');
    process.exit(1);
  }

  console.log('Calling:', FUNCTION_URL);
  console.log('Payload:', JSON.stringify(payload, null, 2));
  console.log('');

  const res = await fetch(FUNCTION_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    },
    body: JSON.stringify(payload),
  });

  const text = await res.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    data = { raw: text };
  }

  console.log('Status:', res.status);
  console.log('Response:', JSON.stringify(data, null, 2));

  if (res.ok && data.clientSecret) {
    console.log('');
    console.log('OK – clientSecret received (use it with Stripe Payment Sheet in the app).');
  } else if (!res.ok) {
    console.log('');
    console.error('Request failed.');
    process.exit(1);
  }

  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
