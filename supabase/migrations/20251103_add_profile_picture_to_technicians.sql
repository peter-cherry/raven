-- Add profile_picture_url field to technicians table
ALTER TABLE technicians ADD COLUMN IF NOT EXISTS profile_picture_url TEXT;

-- Add comment to document the field
COMMENT ON COLUMN technicians.profile_picture_url IS 'URL to the technician profile picture/avatar image';
