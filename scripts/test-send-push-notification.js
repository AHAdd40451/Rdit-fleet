/**
 * Test script for send-push-notification Edge Function.
 * Usage: node scripts/test-send-push-notification.js
 *
 * Set env vars (or create .env and use dotenv):
 *   SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
 *   SUPABASE_ANON_KEY=your_anon_key
 *
 * Or edit the constants below.
 */

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://xejtgfdjfgrzauvztsod.supabase.co'
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhlanRnZmRqZmdyemF1dnp0c29kIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUzOTY1MDMsImV4cCI6MjA4MDk3MjUwM30.CWBmGhPxHF0CC68M1TReTWJMu6tWYFqic1FaYT5jdAs'

const FUNCTION_URL = `${SUPABASE_URL}/functions/v1/send-push-notification`

const payload = {
  userIds: [24],
  title: 'Test notification',
  body: 'This is a test from the script.',
  data: { source: 'test-script' },
}

async function main() {
  if (!SUPABASE_ANON_KEY) {
    console.error('Set SUPABASE_ANON_KEY (env or edit this script). Get it from Dashboard → Settings → API.')
    process.exit(1)
  }

  console.log('Calling:', FUNCTION_URL)
  console.log('Payload:', JSON.stringify(payload, null, 2))

  const res = await fetch(FUNCTION_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
    },
    body: JSON.stringify(payload),
  })

  const text = await res.text()
  let data
  try {
    data = JSON.parse(text)
  } catch {
    data = { raw: text }
  }

  console.log('Status:', res.status)
  console.log('Response:', JSON.stringify(data, null, 2))
  process.exit(res.ok ? 0 : 1)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
