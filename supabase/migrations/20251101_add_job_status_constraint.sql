-- Add missing values to job_status ENUM type
-- Current values: pending, matching, assigned, in_progress, completed, cancelled
-- Adding: active, archived

-- Add 'active' if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'active' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'job_status')) THEN
        ALTER TYPE job_status ADD VALUE 'active';
    END IF;
END $$;

-- Add 'archived' if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'archived' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'job_status')) THEN
        ALTER TYPE job_status ADD VALUE 'archived';
    END IF;
END $$;

-- Add comment explaining the status flow
COMMENT ON COLUMN jobs.job_status IS
'Job status workflow:
- pending/matching: Work order created, no technician assigned (Purple card)
- assigned/active/in_progress: Technician assigned and working (Orange card)
- completed: Job finished (Green card)
- archived: Job archived (Gray card)
- cancelled: Job cancelled';
