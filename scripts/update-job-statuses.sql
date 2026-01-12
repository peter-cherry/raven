-- Update existing jobs to different statuses so you can see all card colors

-- Get the first 5 job IDs and update them to different statuses
WITH jobs_to_update AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY created_at DESC) as rn
  FROM jobs
  LIMIT 5
)
UPDATE jobs
SET job_status = CASE
  WHEN (SELECT rn FROM jobs_to_update WHERE jobs_to_update.id = jobs.id) = 1 THEN 'active'
  WHEN (SELECT rn FROM jobs_to_update WHERE jobs_to_update.id = jobs.id) = 2 THEN 'completed'
  WHEN (SELECT rn FROM jobs_to_update WHERE jobs_to_update.id = jobs.id) = 3 THEN 'pending'
  WHEN (SELECT rn FROM jobs_to_update WHERE jobs_to_update.id = jobs.id) = 4 THEN 'archived'
  ELSE 'assigned'
END
WHERE id IN (SELECT id FROM jobs_to_update);

-- Verify the changes
SELECT id, job_title, job_status FROM jobs ORDER BY created_at DESC LIMIT 10;
