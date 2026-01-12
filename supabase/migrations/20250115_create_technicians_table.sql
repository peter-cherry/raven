-- Technicians Table
CREATE TABLE IF NOT EXISTS technicians (
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

-- Enable RLS
ALTER TABLE technicians ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can view technicians from their org
CREATE POLICY "Users can view technicians from their org"
  ON technicians
  FOR SELECT
  USING (
    org_id IN (
      SELECT org_id FROM public.org_memberships 
      WHERE user_id = auth.uid()
    )
  );

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_technicians_org_id ON technicians(org_id);
CREATE INDEX IF NOT EXISTS idx_technicians_trade_needed ON technicians(trade_needed);
CREATE INDEX IF NOT EXISTS idx_technicians_is_available ON technicians(is_available);
