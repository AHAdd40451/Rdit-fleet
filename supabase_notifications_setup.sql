-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'asset_created',
  asset_id UUID REFERENCES assets(id) ON DELETE SET NULL,
  read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON notifications(user_id, read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_asset_id ON notifications(asset_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_notifications_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_notifications_updated_at
  BEFORE UPDATE ON notifications
  FOR EACH ROW
  EXECUTE FUNCTION update_notifications_updated_at();

-- Enable Row Level Security (RLS)
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Policy: Users can only see their own notifications
CREATE POLICY "Users can view their own notifications"
  ON notifications
  FOR SELECT
  USING (auth.uid()::text IN (
    SELECT id::text FROM users WHERE id = notifications.user_id
  ) OR 
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = notifications.user_id 
    AND (users.email = auth.email() OR users.phone_no = (SELECT raw_user_meta_data->>'phone_no' FROM auth.users WHERE id = auth.uid()))
  ));

-- Policy: Users can update their own notifications (mark as read)
CREATE POLICY "Users can update their own notifications"
  ON notifications
  FOR UPDATE
  USING (auth.uid()::text IN (
    SELECT id::text FROM users WHERE id = notifications.user_id
  ) OR 
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = notifications.user_id 
    AND (users.email = auth.email() OR users.phone_no = (SELECT raw_user_meta_data->>'phone_no' FROM auth.users WHERE id = auth.uid()))
  ));

-- Policy: System can insert notifications (for admin asset creation)
-- Note: This might need adjustment based on your authentication setup
-- For now, allowing authenticated users to insert (you may want to restrict this to admins only)
CREATE POLICY "Authenticated users can insert notifications"
  ON notifications
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- Optional: Grant permissions (adjust as needed based on your setup)
-- GRANT SELECT, UPDATE ON notifications TO authenticated;
-- GRANT INSERT ON notifications TO authenticated;

-- Add comments for documentation
COMMENT ON TABLE notifications IS 'Stores notifications for users when admin creates assets or other events';
COMMENT ON COLUMN notifications.user_id IS 'Reference to the user who should receive this notification';
COMMENT ON COLUMN notifications.message IS 'The notification message text';
COMMENT ON COLUMN notifications.type IS 'Type of notification (e.g., asset_created, asset_updated)';
COMMENT ON COLUMN notifications.asset_id IS 'Optional reference to the related asset';
COMMENT ON COLUMN notifications.read IS 'Whether the notification has been read by the user';

