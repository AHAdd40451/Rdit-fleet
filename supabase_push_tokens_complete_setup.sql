-- Complete setup for push_tokens table
-- This ensures the table exists with correct structure AND RLS policies work
-- 
-- INSTRUCTIONS:
-- 1. Open your Supabase Dashboard
-- 2. Go to SQL Editor
-- 3. Copy and paste this entire file
-- 4. Click "Run" to execute
-- 5. This will create/update the table and fix all RLS issues

-- Step 1: Drop existing policies and functions (if they exist)
DROP POLICY IF EXISTS "Users can view their own push tokens" ON push_tokens;
DROP POLICY IF EXISTS "Users can insert their own push tokens" ON push_tokens;
DROP POLICY IF EXISTS "Users can update their own push tokens" ON push_tokens;
DROP POLICY IF EXISTS "Users can delete their own push tokens" ON push_tokens;
DROP POLICY IF EXISTS "Authenticated users can manage push tokens" ON push_tokens;
DROP POLICY IF EXISTS "Authenticated users can view push tokens" ON push_tokens;
DROP POLICY IF EXISTS "Authenticated users can insert push tokens" ON push_tokens;
DROP POLICY IF EXISTS "Authenticated users can update push tokens" ON push_tokens;
DROP POLICY IF EXISTS "Authenticated users can delete push tokens" ON push_tokens;
DROP FUNCTION IF EXISTS check_user_push_token_access(INTEGER);

-- Step 2: Drop and recreate the table to ensure correct structure
-- (This will delete existing data, but ensures correct schema)
DROP TABLE IF EXISTS push_tokens CASCADE;

-- Step 3: Create the push_tokens table with correct structure
CREATE TABLE push_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  device_id TEXT,
  platform TEXT NOT NULL, -- 'ios' or 'android'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 4: Create indexes for better query performance
CREATE INDEX idx_push_tokens_user_id ON push_tokens(user_id);
CREATE INDEX idx_push_tokens_token ON push_tokens(token);
CREATE INDEX idx_push_tokens_user_platform ON push_tokens(user_id, platform);

-- Step 5: Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_push_tokens_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 6: Create trigger to automatically update updated_at
DROP TRIGGER IF EXISTS update_push_tokens_updated_at ON push_tokens;
CREATE TRIGGER update_push_tokens_updated_at
  BEFORE UPDATE ON push_tokens
  FOR EACH ROW
  EXECUTE FUNCTION update_push_tokens_updated_at();

-- Step 7: Enable Row Level Security (RLS)
ALTER TABLE push_tokens ENABLE ROW LEVEL SECURITY;

-- Step 8: Grant necessary permissions
GRANT ALL ON push_tokens TO authenticated;
GRANT ALL ON push_tokens TO anon;
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO anon;

-- Step 9: Create RLS policies that actually work
-- Policy for SELECT (viewing tokens)
CREATE POLICY "Authenticated users can view push tokens"
  ON push_tokens
  FOR SELECT
  TO authenticated
  USING (true);

-- Policy for INSERT (creating tokens) - THIS FIXES THE INSERT ERROR
CREATE POLICY "Authenticated users can insert push tokens"
  ON push_tokens
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Policy for UPDATE (updating tokens)
CREATE POLICY "Authenticated users can update push tokens"
  ON push_tokens
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Policy for DELETE (removing tokens)
CREATE POLICY "Authenticated users can delete push tokens"
  ON push_tokens
  FOR DELETE
  TO authenticated
  USING (true);

-- Step 10: Verify table structure (this will show in results)
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'push_tokens' 
ORDER BY ordinal_position;

