-- Add assigned_tech_id column to jobs table
ALTER TABLE jobs
ADD COLUMN IF NOT EXISTS assigned_tech_id UUID REFERENCES technicians(id) ON DELETE SET NULL;

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_jobs_assigned_tech ON jobs(assigned_tech_id);

-- Add comment
COMMENT ON COLUMN jobs.assigned_tech_id IS 'ID of the technician assigned to this job';
