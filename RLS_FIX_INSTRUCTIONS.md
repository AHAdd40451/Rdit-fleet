# Fixing RLS Permission Error for Push Tokens

## Problem
You're getting this error:
```
ERROR Error checking existing token: {"code": "42501", "details": null, "hint": null, "message": "permission denied for table users"}
```

This happens because the RLS policies on `push_tokens` try to query the `users` table, but your app user doesn't have permission to read from the `users` table.

## Solution

You have two options:

### Option 1: Use the Fixed SQL (Recommended)

Run the fixed SQL file in your Supabase SQL editor:

```sql
-- File: supabase_push_tokens_setup_fixed.sql
```

This creates a `SECURITY DEFINER` function that can access the `users` table even when the caller cannot.

### Option 2: Update Existing Policies

If you've already run the original SQL, run this in Supabase SQL editor to fix it:

```sql
-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own push tokens" ON push_tokens;
DROP POLICY IF EXISTS "Users can insert their own push tokens" ON push_tokens;
DROP POLICY IF EXISTS "Users can update their own push tokens" ON push_tokens;
DROP POLICY IF EXISTS "Users can delete their own push tokens" ON push_tokens;

-- Create security definer function
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
  current_user_email := auth.email();
  
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

-- Recreate policies using the function
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
```

### Option 3: Simpler Approach (Development Only)

If you're in development and want a quick fix, you can use this simpler policy that allows any authenticated user:

```sql
-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own push tokens" ON push_tokens;
DROP POLICY IF EXISTS "Users can insert their own push tokens" ON push_tokens;
DROP POLICY IF EXISTS "Users can update their own push tokens" ON push_tokens;
DROP POLICY IF EXISTS "Users can delete their own push tokens" ON push_tokens;

-- Simple policy for development
CREATE POLICY "Authenticated users can manage push tokens"
  ON push_tokens
  FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');
```

**⚠️ Warning**: Option 3 is less secure and should only be used for development. In production, use Option 1 or 2.

## After Running the Fix

1. Restart your app
2. Try logging in again
3. Check the console - the error should be gone
4. Push tokens should now save successfully

## Verification

After applying the fix, you can verify it works by:

1. Logging into your app
2. Checking the console for "Push token saved successfully" message
3. Querying the `push_tokens` table in Supabase to see if your token was saved

```sql
SELECT * FROM push_tokens ORDER BY created_at DESC LIMIT 5;
```

