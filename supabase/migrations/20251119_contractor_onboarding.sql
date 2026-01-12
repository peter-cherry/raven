-- Contractor Onboarding Database Schema
-- Migration: 20251119_contractor_onboarding
-- Purpose: Add tables and columns needed for contractor onboarding flow

-- =====================================
-- 1. UPDATE TECHNICIANS TABLE
-- =====================================

-- Add new columns to existing technicians table
ALTER TABLE public.technicians ADD COLUMN IF NOT EXISTS trades TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE public.technicians ADD COLUMN IF NOT EXISTS years_experience INTEGER;
ALTER TABLE public.technicians ADD COLUMN IF NOT EXISTS background_check_authorized BOOLEAN DEFAULT FALSE;
ALTER TABLE public.technicians ADD COLUMN IF NOT EXISTS electronic_signature TEXT;
ALTER TABLE public.technicians ADD COLUMN IF NOT EXISTS onboarding_complete BOOLEAN DEFAULT FALSE;
ALTER TABLE public.technicians ADD COLUMN IF NOT EXISTS onboarding_completed_at TIMESTAMPTZ;

-- Add comments for documentation
COMMENT ON COLUMN public.technicians.trades IS 'Array of trade types: hvac, plumbing, electrical, general, handyman';
COMMENT ON COLUMN public.technicians.years_experience IS 'Total years of professional experience';
COMMENT ON COLUMN public.technicians.background_check_authorized IS 'Contractor authorized background check';
COMMENT ON COLUMN public.technicians.electronic_signature IS 'Electronic signature (full name typed)';
COMMENT ON COLUMN public.technicians.onboarding_complete IS 'Whether contractor completed onboarding flow';
COMMENT ON COLUMN public.technicians.onboarding_completed_at IS 'Timestamp when onboarding was completed';

-- =====================================
-- 2. CREATE CONTRACTOR_LICENSES TABLE
-- =====================================

CREATE TABLE IF NOT EXISTS public.contractor_licenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contractor_id UUID NOT NULL REFERENCES public.technicians(id) ON DELETE CASCADE,
  license_name TEXT NOT NULL,
  license_number TEXT NOT NULL,
  state TEXT NOT NULL,
  expiration_date DATE NOT NULL,
  document_url TEXT,
  verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Add comments
COMMENT ON TABLE public.contractor_licenses IS 'State-specific licenses held by contractors';
COMMENT ON COLUMN public.contractor_licenses.license_name IS 'Name of license (e.g., HVAC Contractor License)';
COMMENT ON COLUMN public.contractor_licenses.license_number IS 'License number from issuing authority';
COMMENT ON COLUMN public.contractor_licenses.state IS 'State that issued the license (2-letter code)';
COMMENT ON COLUMN public.contractor_licenses.expiration_date IS 'Date when license expires';
COMMENT ON COLUMN public.contractor_licenses.document_url IS 'URL to uploaded license document image';
COMMENT ON COLUMN public.contractor_licenses.verified IS 'Whether license has been verified by admin';

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_contractor_licenses_contractor_id ON public.contractor_licenses(contractor_id);
CREATE INDEX IF NOT EXISTS idx_contractor_licenses_expiration ON public.contractor_licenses(expiration_date);

-- =====================================
-- 3. CREATE CONTRACTOR_CERTIFICATIONS TABLE
-- =====================================

CREATE TABLE IF NOT EXISTS public.contractor_certifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contractor_id UUID NOT NULL REFERENCES public.technicians(id) ON DELETE CASCADE,
  certification_name TEXT NOT NULL,
  certification_number TEXT,
  expiration_date DATE,
  document_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Add comments
COMMENT ON TABLE public.contractor_certifications IS 'Professional certifications held by contractors';
COMMENT ON COLUMN public.contractor_certifications.certification_name IS 'Name of certification (e.g., EPA 608 Universal)';
COMMENT ON COLUMN public.contractor_certifications.certification_number IS 'Certification number (optional)';
COMMENT ON COLUMN public.contractor_certifications.expiration_date IS 'Date when certification expires (if applicable)';
COMMENT ON COLUMN public.contractor_certifications.document_url IS 'URL to uploaded certification document';

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_contractor_certifications_contractor_id ON public.contractor_certifications(contractor_id);

-- =====================================
-- 4. CREATE CONTRACTOR_INSURANCE TABLE
-- =====================================

CREATE TABLE IF NOT EXISTS public.contractor_insurance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contractor_id UUID NOT NULL REFERENCES public.technicians(id) ON DELETE CASCADE,
  insurance_type TEXT NOT NULL,
  carrier TEXT NOT NULL,
  policy_number TEXT NOT NULL,
  coverage_amount NUMERIC,
  expiration_date DATE NOT NULL,
  document_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Add comments
COMMENT ON TABLE public.contractor_insurance IS 'Insurance policies held by contractors';
COMMENT ON COLUMN public.contractor_insurance.insurance_type IS 'Type: general_liability, workers_comp, auto, umbrella';
COMMENT ON COLUMN public.contractor_insurance.carrier IS 'Insurance carrier/company name';
COMMENT ON COLUMN public.contractor_insurance.policy_number IS 'Policy number from carrier';
COMMENT ON COLUMN public.contractor_insurance.coverage_amount IS 'Coverage amount in dollars';
COMMENT ON COLUMN public.contractor_insurance.expiration_date IS 'Date when policy expires';
COMMENT ON COLUMN public.contractor_insurance.document_url IS 'URL to Certificate of Insurance (COI) document';

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_contractor_insurance_contractor_id ON public.contractor_insurance(contractor_id);
CREATE INDEX IF NOT EXISTS idx_contractor_insurance_type ON public.contractor_insurance(insurance_type);
CREATE INDEX IF NOT EXISTS idx_contractor_insurance_expiration ON public.contractor_insurance(expiration_date);

-- =====================================
-- 5. ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================

-- Enable RLS on new tables
ALTER TABLE public.contractor_licenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contractor_certifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contractor_insurance ENABLE ROW LEVEL SECURITY;

-- Contractor Licenses Policies
CREATE POLICY "Contractors can view their own licenses"
  ON public.contractor_licenses
  FOR SELECT
  USING (
    contractor_id IN (
      SELECT id FROM public.technicians WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Contractors can insert their own licenses"
  ON public.contractor_licenses
  FOR INSERT
  WITH CHECK (
    contractor_id IN (
      SELECT id FROM public.technicians WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Contractors can update their own licenses"
  ON public.contractor_licenses
  FOR UPDATE
  USING (
    contractor_id IN (
      SELECT id FROM public.technicians WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Contractors can delete their own licenses"
  ON public.contractor_licenses
  FOR DELETE
  USING (
    contractor_id IN (
      SELECT id FROM public.technicians WHERE user_id = auth.uid()
    )
  );

-- Contractor Certifications Policies
CREATE POLICY "Contractors can view their own certifications"
  ON public.contractor_certifications
  FOR SELECT
  USING (
    contractor_id IN (
      SELECT id FROM public.technicians WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Contractors can insert their own certifications"
  ON public.contractor_certifications
  FOR INSERT
  WITH CHECK (
    contractor_id IN (
      SELECT id FROM public.technicians WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Contractors can update their own certifications"
  ON public.contractor_certifications
  FOR UPDATE
  USING (
    contractor_id IN (
      SELECT id FROM public.technicians WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Contractors can delete their own certifications"
  ON public.contractor_certifications
  FOR DELETE
  USING (
    contractor_id IN (
      SELECT id FROM public.technicians WHERE user_id = auth.uid()
    )
  );

-- Contractor Insurance Policies
CREATE POLICY "Contractors can view their own insurance"
  ON public.contractor_insurance
  FOR SELECT
  USING (
    contractor_id IN (
      SELECT id FROM public.technicians WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Contractors can insert their own insurance"
  ON public.contractor_insurance
  FOR INSERT
  WITH CHECK (
    contractor_id IN (
      SELECT id FROM public.technicians WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Contractors can update their own insurance"
  ON public.contractor_insurance
  FOR UPDATE
  USING (
    contractor_id IN (
      SELECT id FROM public.technicians WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Contractors can delete their own insurance"
  ON public.contractor_insurance
  FOR DELETE
  USING (
    contractor_id IN (
      SELECT id FROM public.technicians WHERE user_id = auth.uid()
    )
  );

-- =====================================
-- 6. HELPER FUNCTIONS
-- =====================================

-- Function to get contractor's complete profile
CREATE OR REPLACE FUNCTION public.get_contractor_profile(contractor_uuid UUID)
RETURNS JSON AS $$
DECLARE
  profile_json JSON;
BEGIN
  SELECT json_build_object(
    'contractor', t.*,
    'licenses', (
      SELECT json_agg(l.*)
      FROM public.contractor_licenses l
      WHERE l.contractor_id = contractor_uuid
    ),
    'certifications', (
      SELECT json_agg(c.*)
      FROM public.contractor_certifications c
      WHERE c.contractor_id = contractor_uuid
    ),
    'insurance', (
      SELECT json_agg(i.*)
      FROM public.contractor_insurance i
      WHERE i.contractor_id = contractor_uuid
    )
  )
  INTO profile_json
  FROM public.technicians t
  WHERE t.id = contractor_uuid;

  RETURN profile_json;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if contractor has expired documents
CREATE OR REPLACE FUNCTION public.has_expired_documents(contractor_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
  has_expired BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM public.contractor_licenses
    WHERE contractor_id = contractor_uuid AND expiration_date < CURRENT_DATE
  ) OR EXISTS (
    SELECT 1 FROM public.contractor_certifications
    WHERE contractor_id = contractor_uuid AND expiration_date < CURRENT_DATE
  ) OR EXISTS (
    SELECT 1 FROM public.contractor_insurance
    WHERE contractor_id = contractor_uuid AND expiration_date < CURRENT_DATE
  )
  INTO has_expired;

  RETURN has_expired;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================
-- 7. TRIGGERS FOR UPDATED_AT
-- =====================================

-- Create trigger function for updating updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to contractor_licenses
DROP TRIGGER IF EXISTS update_contractor_licenses_updated_at ON public.contractor_licenses;
CREATE TRIGGER update_contractor_licenses_updated_at
  BEFORE UPDATE ON public.contractor_licenses
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Apply trigger to contractor_insurance
DROP TRIGGER IF EXISTS update_contractor_insurance_updated_at ON public.contractor_insurance;
CREATE TRIGGER update_contractor_insurance_updated_at
  BEFORE UPDATE ON public.contractor_insurance
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
