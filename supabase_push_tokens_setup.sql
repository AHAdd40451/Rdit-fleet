-- Create push_tokens table to store Expo push notification tokens
CREATE TABLE IF NOT EXISTS push_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  device_id TEXT,
  platform TEXT NOT NULL, -- 'ios' or 'android'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_push_tokens_user_id ON push_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_push_tokens_token ON push_tokens(token);
CREATE INDEX IF NOT EXISTS idx_push_tokens_user_platform ON push_tokens(user_id, platform);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_push_tokens_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_push_tokens_updated_at
  BEFORE UPDATE ON push_tokens
  FOR EACH ROW
  EXECUTE FUNCTION update_push_tokens_updated_at();

-- Enable Row Level Security (RLS)
ALTER TABLE push_tokens ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- RLS POLICIES - Simplified version that doesn't require users table access
-- ============================================================================

-- Create a security definer function to check user access
-- This function can access the users table even when the caller cannot
CREATE OR REPLACE FUNCTION check_user_push_token_access(check_user_id INTEGER)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_user_email TEXT;
  user_exists BOOLEAN;
BEGIN
  -- Get current user's email from auth
  current_user_email := auth.email();
  
  -- Check if the user_id matches the current authenticated user
  -- This works for both email-based and phone-based auth
  SELECT EXISTS (
    SELECT 1 FROM users 
    WHERE id = check_user_id 
    AND (
      email = current_user_email 
      OR phone_no = current_user_email
      OR id::text = auth.uid()::text
    )
  ) INTO user_exists;
  
  RETURN COALESCE(user_exists, false);
END;
$$;

-- Policy: Users can view their own push tokens
CREATE POLICY "Users can view their own push tokens"
  ON push_tokens
  FOR SELECT
  USING (check_user_push_token_access(user_id));

-- Policy: Users can insert their own push tokens
CREATE POLICY "Users can insert their own push tokens"
  ON push_tokens
  FOR INSERT
  WITH CHECK (check_user_push_token_access(user_id));

-- Policy: Users can update their own push tokens
CREATE POLICY "Users can update their own push tokens"
  ON push_tokens
  FOR UPDATE
  USING (check_user_push_token_access(user_id))
  WITH CHECK (check_user_push_token_access(user_id));

-- Policy: Users can delete their own push tokens
CREATE POLICY "Users can delete their own push tokens"
  ON push_tokens
  FOR DELETE
  USING (check_user_push_token_access(user_id));

-- ============================================================================
-- ALTERNATIVE: If the above doesn't work, use this simpler approach
-- (Allows any authenticated user - less secure but works for development)
-- ============================================================================

-- Uncomment the following if the security definer function approach doesn't work:
/*
DROP POLICY IF EXISTS "Users can view their own push tokens" ON push_tokens;
DROP POLICY IF EXISTS "Users can insert their own push tokens" ON push_tokens;
DROP POLICY IF EXISTS "Users can update their own push tokens" ON push_tokens;
DROP POLICY IF EXISTS "Users can delete their own push tokens" ON push_tokens;

CREATE POLICY "Authenticated users can manage push tokens"
  ON push_tokens
  FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');
*/

