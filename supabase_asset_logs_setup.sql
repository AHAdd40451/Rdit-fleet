  -- Create asset_logs table to track all asset-related activities
  CREATE TABLE IF NOT EXISTS asset_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    asset_id UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
    user_id UUID NOT NULL, -- The user who performed the action (can be admin or regular user)
    action TEXT NOT NULL, -- 'created', 'updated', 'deleted', etc.
    user_role TEXT NOT NULL, -- 'admin' or 'user' - role of the user who performed the action
    changes JSONB, -- JSON object storing the changes made (for updates)
    old_values JSONB, -- JSON object storing old values (for updates)
    new_values JSONB, -- JSON object storing new values (for updates/creates)
    description TEXT, -- Human-readable description of the action
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  );

  -- Create indexes for better query performance
  CREATE INDEX IF NOT EXISTS idx_asset_logs_asset_id ON asset_logs(asset_id);
  CREATE INDEX IF NOT EXISTS idx_asset_logs_user_id ON asset_logs(user_id);
  CREATE INDEX IF NOT EXISTS idx_asset_logs_action ON asset_logs(action);
  CREATE INDEX IF NOT EXISTS idx_asset_logs_user_role ON asset_logs(user_role);
  CREATE INDEX IF NOT EXISTS idx_asset_logs_created_at ON asset_logs(created_at DESC);
  CREATE INDEX IF NOT EXISTS idx_asset_logs_asset_created ON asset_logs(asset_id, created_at DESC);

  -- Enable Row Level Security (RLS)
  ALTER TABLE asset_logs ENABLE ROW LEVEL SECURITY;

  -- Create RLS policies
  -- Policy: Users can view logs for assets they have access to
  CREATE POLICY "Users can view asset logs for their assets"
    ON asset_logs
    FOR SELECT
    USING (
      -- Admin can see logs for assets they created
      -- Use CAST to handle UUID/TEXT type differences
      EXISTS (
        SELECT 1 FROM assets 
        WHERE assets.id = asset_logs.asset_id 
        AND CAST(assets.user_id AS TEXT) = CAST(auth.uid() AS TEXT)
      )
      OR
      -- Regular users can see logs for assets created by their admin
      EXISTS (
        SELECT 1 FROM assets 
        JOIN users ON CAST(assets.user_id AS TEXT) = CAST(users."userId" AS TEXT)
        WHERE assets.id = asset_logs.asset_id 
        AND (
          users.email = auth.email() 
          OR users.phone_no = (SELECT raw_user_meta_data->>'phone_no' FROM auth.users WHERE id = auth.uid())
        )
      )
    );

  -- Policy: Authenticated users can insert logs (when they perform actions)
  CREATE POLICY "Authenticated users can insert asset logs"
    ON asset_logs
    FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

  -- Add comments for documentation
  COMMENT ON TABLE asset_logs IS 'Stores logs of all asset-related activities (creation, updates, etc.)';
  COMMENT ON COLUMN asset_logs.asset_id IS 'Reference to the asset that was modified';
  COMMENT ON COLUMN asset_logs.user_id IS 'UUID of the user who performed the action';
  COMMENT ON COLUMN asset_logs.action IS 'Type of action performed (created, updated, deleted)';
  COMMENT ON COLUMN asset_logs.user_role IS 'Role of the user who performed the action (admin or user)';
  COMMENT ON COLUMN asset_logs.changes IS 'JSON object containing only the fields that were changed';
  COMMENT ON COLUMN asset_logs.old_values IS 'JSON object containing old values before update';
  COMMENT ON COLUMN asset_logs.new_values IS 'JSON object containing new values after update/create';
  COMMENT ON COLUMN asset_logs.description IS 'Human-readable description of what was done';

