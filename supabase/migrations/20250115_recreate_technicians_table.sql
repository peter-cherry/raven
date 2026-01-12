-- Drop existing technicians table if it exists
DROP TABLE IF EXISTS technicians CASCADE;

-- Create technicians table
CREATE TABLE technicians (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  trade_needed TEXT NOT NULL,
  city TEXT,
  state TEXT,
  lat DECIMAL(10, 8),
  lng DECIMAL(11, 8),
  average_rating NUMERIC,
  is_available BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Create indexes
CREATE INDEX idx_technicians_org_id ON technicians(org_id);
CREATE INDEX idx_technicians_trade_needed ON technicians(trade_needed);
CREATE INDEX idx_technicians_is_available ON technicians(is_available);

-- Disable RLS for now to allow inserts
ALTER TABLE technicians DISABLE ROW LEVEL SECURITY;
