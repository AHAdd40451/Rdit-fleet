-- Add notification_type column to asset_logs table
-- This column stores the type of maintenance notification for asset updates

ALTER TABLE asset_logs 
ADD COLUMN IF NOT EXISTS notification_type TEXT;

-- Add comment for documentation
COMMENT ON COLUMN asset_logs.notification_type IS 'Type of maintenance notification: Oil Change, Tire Rotation / Replacement, General Inspection, Fluids, Belts, Lights, Battery, Brake Inspection, Compliance Inspection (DOT, State, CDL-related), Custom (Admin-created)';

-- Create index for better query performance when filtering by notification_type
CREATE INDEX IF NOT EXISTS idx_asset_logs_notification_type ON asset_logs(notification_type);

-- Optional: Add a check constraint to ensure only valid notification types are used
-- Uncomment if you want to enforce the values at the database level
/*
ALTER TABLE asset_logs 
ADD CONSTRAINT check_notification_type 
CHECK (notification_type IS NULL OR notification_type IN (
  'Oil Change',
  'Tire Rotation / Replacement',
  'General Inspection',
  'Fluids',
  'Belts',
  'Lights',
  'Battery',
  'Brake Inspection',
  'Compliance Inspection (DOT, State, CDL-related)',
  'Custom (Admin-created)'
));
*/
