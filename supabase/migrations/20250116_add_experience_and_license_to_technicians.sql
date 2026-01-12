-- Add missing columns to technicians table
-- These columns are collected in the signup form but were not being stored

-- Add years_experience column
ALTER TABLE technicians
ADD COLUMN IF NOT EXISTS years_experience INTEGER;

-- Add license_number column
ALTER TABLE technicians
ADD COLUMN IF NOT EXISTS license_number TEXT;

-- Add comments for documentation
COMMENT ON COLUMN technicians.years_experience IS 'Number of years of professional experience in their trade (0-50+)';
COMMENT ON COLUMN technicians.license_number IS 'Professional license number if applicable (optional)';

-- Create index on years_experience for potential experience-based filtering
CREATE INDEX IF NOT EXISTS idx_technicians_years_experience ON technicians(years_experience);
