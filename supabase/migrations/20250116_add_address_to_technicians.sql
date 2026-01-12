-- Add address_text column to technicians table
-- This provides precise geocoding for accurate distance-based matching

ALTER TABLE technicians
ADD COLUMN IF NOT EXISTS address_text TEXT;

-- Add comment for documentation
COMMENT ON COLUMN technicians.address_text IS 'Full street address for precise geocoding and distance calculations. Not displayed publicly - used for job matching only.';

-- Create index for potential address-based queries
CREATE INDEX IF NOT EXISTS idx_technicians_address ON technicians(address_text);
