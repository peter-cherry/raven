-- Add show_in_quick column to compliance_templates
ALTER TABLE public.compliance_templates 
ADD COLUMN IF NOT EXISTS show_in_quick BOOLEAN DEFAULT true;

-- Set default templates to show in quick
UPDATE public.compliance_templates 
SET show_in_quick = true 
WHERE is_builtin = true;
