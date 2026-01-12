-- Create compliance requirements table
CREATE TABLE IF NOT EXISTS public.compliance_requirements (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL,
  requirement_type TEXT NOT NULL,
  enforcement TEXT NOT NULL DEFAULT 'DISABLED'::text,
  weight INTEGER NOT NULL DEFAULT 0,
  min_valid_days INTEGER NOT NULL DEFAULT 0,
  CONSTRAINT compliance_requirements_pkey PRIMARY KEY (id),
  CONSTRAINT compliance_requirements_org_id_requirement_type_key UNIQUE (org_id, requirement_type),
  CONSTRAINT compliance_requirements_org_id_fkey FOREIGN KEY (org_id) REFERENCES organizations (id) ON DELETE CASCADE
);
