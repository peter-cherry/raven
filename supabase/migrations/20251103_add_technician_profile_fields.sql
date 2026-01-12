-- Add missing fields to technicians table for complete profile
ALTER TABLE technicians ADD COLUMN IF NOT EXISTS service_area_radius INTEGER DEFAULT 50;
ALTER TABLE technicians ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE technicians ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE technicians ADD COLUMN IF NOT EXISTS email TEXT;

-- Add comments
COMMENT ON COLUMN technicians.service_area_radius IS 'Service area radius in miles - how far the technician is willing to travel';
COMMENT ON COLUMN technicians.bio IS 'Professional bio and experience description';
COMMENT ON COLUMN technicians.phone IS 'Technician contact phone number';
COMMENT ON COLUMN technicians.email IS 'Technician contact email address';
