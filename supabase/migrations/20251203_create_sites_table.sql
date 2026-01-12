-- Create sites table
CREATE TABLE IF NOT EXISTS public.sites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('retail', 'office', 'warehouse', 'other')),
    address TEXT NOT NULL,
    city TEXT NOT NULL,
    state TEXT NOT NULL,
    zip TEXT NOT NULL,
    lat DECIMAL(10, 8),
    lng DECIMAL(11, 8),
    client_name TEXT,
    client_contact TEXT,
    use_org_policy BOOLEAN NOT NULL DEFAULT true,
    custom_policy_id UUID,
    active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Create indexes for sites table
CREATE INDEX IF NOT EXISTS idx_sites_organization_id ON public.sites(organization_id);
CREATE INDEX IF NOT EXISTS idx_sites_active ON public.sites(active);
CREATE INDEX IF NOT EXISTS idx_sites_city_state ON public.sites(city, state);
CREATE INDEX IF NOT EXISTS idx_sites_created_by ON public.sites(created_by);

-- Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add trigger to automatically update updated_at
CREATE TRIGGER set_sites_updated_at
    BEFORE UPDATE ON public.sites
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Enable Row Level Security
ALTER TABLE public.sites ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can view sites in their organization
CREATE POLICY "Users can view sites in their organization"
    ON public.sites
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.org_memberships
            WHERE org_memberships.org_id = sites.organization_id
            AND org_memberships.user_id = auth.uid()
        )
    );

-- RLS Policy: Users can create sites in their organization
CREATE POLICY "Users can create sites in their organization"
    ON public.sites
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.org_memberships
            WHERE org_memberships.org_id = sites.organization_id
            AND org_memberships.user_id = auth.uid()
        )
    );

-- RLS Policy: Users can update sites in their organization
CREATE POLICY "Users can update sites in their organization"
    ON public.sites
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.org_memberships
            WHERE org_memberships.org_id = sites.organization_id
            AND org_memberships.user_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.org_memberships
            WHERE org_memberships.org_id = sites.organization_id
            AND org_memberships.user_id = auth.uid()
        )
    );

-- RLS Policy: Users can delete sites in their organization (optional, but good to have)
CREATE POLICY "Users can delete sites in their organization"
    ON public.sites
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.org_memberships
            WHERE org_memberships.org_id = sites.organization_id
            AND org_memberships.user_id = auth.uid()
        )
    );

-- Add site_id column to jobs table (nullable for backwards compatibility)
ALTER TABLE public.jobs
    ADD COLUMN IF NOT EXISTS site_id UUID REFERENCES public.sites(id) ON DELETE SET NULL;

-- Create index on jobs.site_id for better query performance
CREATE INDEX IF NOT EXISTS idx_jobs_site_id ON public.jobs(site_id);

-- Add comment to document the relationship
COMMENT ON COLUMN public.jobs.site_id IS 'Links job to a specific site location. Nullable for backwards compatibility.';
COMMENT ON TABLE public.sites IS 'Stores physical site locations for organizations (retail stores, offices, warehouses, etc.)';
