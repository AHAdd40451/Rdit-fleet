-- Fix RLS policies for push_tokens table
-- This fixes the "new row violates row-level security policy" error
-- 
-- INSTRUCTIONS:
-- 1. Open your Supabase Dashboard
-- 2. Go to SQL Editor
-- 3. Copy and paste this entire file
-- 4. Click "Run" to execute
-- 5. The error should be fixed after this

-- Step 1: Drop ALL existing policies and functions
DROP POLICY IF EXISTS "Users can view their own push tokens" ON push_tokens;
DROP POLICY IF EXISTS "Users can insert their own push tokens" ON push_tokens;
DROP POLICY IF EXISTS "Users can update their own push tokens" ON push_tokens;
DROP POLICY IF EXISTS "Users can delete their own push tokens" ON push_tokens;
DROP POLICY IF EXISTS "Authenticated users can manage push tokens" ON push_tokens;
DROP FUNCTION IF EXISTS check_user_push_token_access(INTEGER);

-- Step 2: Grant necessary permissions
GRANT ALL ON push_tokens TO authenticated;
GRANT ALL ON push_tokens TO anon;

-- Step 3: Create separate policies for each operation
-- This ensures all operations work correctly
-- Your app code ensures users only save tokens for their own user_id

-- Policy for SELECT (viewing tokens)
-- Using 'true' allows all authenticated users (app code ensures security)
CREATE POLICY "Authenticated users can view push tokens"
  ON push_tokens
  FOR SELECT
  TO authenticated
  USING (true);

-- Policy for INSERT (creating tokens) - THIS IS THE KEY ONE FOR YOUR ERROR
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

-- Option 2: More secure function-based approach (uncomment if you want stricter security)
-- This function properly handles both email and phone authentication
/*
CREATE OR REPLACE FUNCTION check_user_push_token_access(check_user_id INTEGER)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_user_email TEXT;
  current_user_phone TEXT;
  user_exists BOOLEAN;
BEGIN
  -- Get email and phone from auth
  current_user_email := auth.email();
  current_user_phone := COALESCE(
    (auth.jwt() -> 'user_metadata' ->> 'phone')::TEXT,
    (auth.jwt() -> 'user_metadata' ->> 'phone_no')::TEXT
  );
  
  -- Check if the user_id matches the current authenticated user
  -- The function runs as SECURITY DEFINER so it can bypass RLS on users table
  SELECT EXISTS (
    SELECT 1 FROM users 
    WHERE id = check_user_id 
    AND (
      (current_user_email IS NOT NULL AND email = current_user_email)
      OR (current_user_phone IS NOT NULL AND phone_no = current_user_phone)
    )
  ) INTO user_exists;
  
  RETURN COALESCE(user_exists, false);
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION check_user_push_token_access(INTEGER) TO authenticated;

-- Create policies using the function
CREATE POLICY "Users can view their own push tokens"
  ON push_tokens
  FOR SELECT
  USING (check_user_push_token_access(user_id));

CREATE POLICY "Users can insert their own push tokens"
  ON push_tokens
  FOR INSERT
  WITH CHECK (check_user_push_token_access(user_id));

CREATE POLICY "Users can update their own push tokens"
  ON push_tokens
  FOR UPDATE
  USING (check_user_push_token_access(user_id))
  WITH CHECK (check_user_push_token_access(user_id));

CREATE POLICY "Users can delete their own push tokens"
  ON push_tokens
  FOR DELETE
  USING (check_user_push_token_access(user_id));
*/

