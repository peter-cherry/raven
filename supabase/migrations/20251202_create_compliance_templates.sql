-- Create compliance templates table for COI configuration
CREATE TABLE IF NOT EXISTS public.compliance_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  is_builtin BOOLEAN DEFAULT false,
  gl_amount INTEGER DEFAULT 1000000,
  auto_amount INTEGER DEFAULT 1000000,
  wc_amount INTEGER DEFAULT 1000000,
  el_amount INTEGER DEFAULT 1000000,
  cpl_amount INTEGER DEFAULT 500000,
  additional_insured BOOLEAN DEFAULT true,
  waiver_of_subrogation BOOLEAN DEFAULT true,
  primary_non_contributory BOOLEAN DEFAULT false,
  min_days_to_expiry INTEGER DEFAULT 30,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT compliance_templates_pkey PRIMARY KEY (id),
  CONSTRAINT compliance_templates_org_id_name_key UNIQUE (org_id, name),
  CONSTRAINT compliance_templates_org_id_fkey FOREIGN KEY (org_id) REFERENCES organizations (id) ON DELETE CASCADE
);

-- Enable RLS
ALTER TABLE public.compliance_templates ENABLE ROW LEVEL SECURITY;

-- RLS policies for compliance_templates
CREATE POLICY "Users can view templates for their organization"
  ON public.compliance_templates
  FOR SELECT
  USING (
    org_id IN (
      SELECT org_id FROM public.org_memberships
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert templates for their organization"
  ON public.compliance_templates
  FOR INSERT
  WITH CHECK (
    org_id IN (
      SELECT org_id FROM public.org_memberships
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update templates for their organization"
  ON public.compliance_templates
  FOR UPDATE
  USING (
    org_id IN (
      SELECT org_id FROM public.org_memberships
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete non-builtin templates for their organization"
  ON public.compliance_templates
  FOR DELETE
  USING (
    org_id IN (
      SELECT org_id FROM public.org_memberships
      WHERE user_id = auth.uid()
    )
    AND is_builtin = false
  );

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_compliance_templates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER compliance_templates_updated_at
  BEFORE UPDATE ON public.compliance_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_compliance_templates_updated_at();

-- Add index for faster lookups
CREATE INDEX compliance_templates_org_id_idx ON public.compliance_templates(org_id);
