-- Add raw_text column to jobs table
-- This stores the original unstructured text input when creating a job

ALTER TABLE jobs
ADD COLUMN IF NOT EXISTS raw_text TEXT;

-- Add comment to describe the column
COMMENT ON COLUMN jobs.raw_text IS 'Original unstructured text input when creating the job via natural language';
