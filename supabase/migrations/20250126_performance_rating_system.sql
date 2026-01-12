-- Performance Rating System Migration
-- Creates job_ratings table with dimensional ratings and automated statistics tracking

-- ============================================================================
-- 1. CREATE JOB_RATINGS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.job_ratings (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL,
  technician_id UUID NOT NULL,
  rated_by UUID NOT NULL,
  org_id UUID NOT NULL,

  -- Dimensional ratings (1-5 stars each)
  quality_rating INTEGER NOT NULL CHECK (quality_rating >= 1 AND quality_rating <= 5),
  professionalism_rating INTEGER NOT NULL CHECK (professionalism_rating >= 1 AND professionalism_rating <= 5),
  timeliness_rating INTEGER NOT NULL CHECK (timeliness_rating >= 1 AND timeliness_rating <= 5),
  communication_rating INTEGER NOT NULL CHECK (communication_rating >= 1 AND communication_rating <= 5),

  -- Calculated overall rating (average of dimensional ratings)
  overall_rating DECIMAL(3, 2) NOT NULL,

  -- Optional feedback
  feedback_text TEXT,

  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT job_ratings_pkey PRIMARY KEY (id),
  CONSTRAINT job_ratings_job_id_fkey FOREIGN KEY (job_id) REFERENCES jobs (id) ON DELETE CASCADE,
  CONSTRAINT job_ratings_technician_id_fkey FOREIGN KEY (technician_id) REFERENCES technicians (id) ON DELETE CASCADE,
  CONSTRAINT job_ratings_org_id_fkey FOREIGN KEY (org_id) REFERENCES organizations (id) ON DELETE CASCADE,

  -- Ensure only one rating per job
  CONSTRAINT job_ratings_job_id_unique UNIQUE (job_id)
);

-- Add indexes for common queries
CREATE INDEX IF NOT EXISTS idx_job_ratings_technician_id ON public.job_ratings (technician_id);
CREATE INDEX IF NOT EXISTS idx_job_ratings_job_id ON public.job_ratings (job_id);
CREATE INDEX IF NOT EXISTS idx_job_ratings_org_id ON public.job_ratings (org_id);
CREATE INDEX IF NOT EXISTS idx_job_ratings_created_at ON public.job_ratings (created_at DESC);

-- Add comments
COMMENT ON TABLE public.job_ratings IS 'Job performance ratings with dimensional scoring (quality, professionalism, timeliness, communication)';
COMMENT ON COLUMN public.job_ratings.quality_rating IS 'Quality of work rating (1-5 stars)';
COMMENT ON COLUMN public.job_ratings.professionalism_rating IS 'Professionalism rating (1-5 stars)';
COMMENT ON COLUMN public.job_ratings.timeliness_rating IS 'Timeliness rating (1-5 stars)';
COMMENT ON COLUMN public.job_ratings.communication_rating IS 'Communication rating (1-5 stars)';
COMMENT ON COLUMN public.job_ratings.overall_rating IS 'Average of all dimensional ratings (calculated)';

-- ============================================================================
-- 2. ADD PERFORMANCE TRACKING COLUMNS TO TECHNICIANS TABLE
-- ============================================================================

ALTER TABLE public.technicians
  ADD COLUMN IF NOT EXISTS average_rating DECIMAL(3, 2) DEFAULT 0.0,
  ADD COLUMN IF NOT EXISTS total_ratings INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS jobs_completed INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_rating_at TIMESTAMPTZ;

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_technicians_average_rating ON public.technicians (average_rating DESC);
CREATE INDEX IF NOT EXISTS idx_technicians_jobs_completed ON public.technicians (jobs_completed DESC);

-- Add comments
COMMENT ON COLUMN public.technicians.average_rating IS 'Average overall rating across all jobs (0.00 to 5.00)';
COMMENT ON COLUMN public.technicians.total_ratings IS 'Total number of ratings received';
COMMENT ON COLUMN public.technicians.jobs_completed IS 'Total number of completed jobs';
COMMENT ON COLUMN public.technicians.last_rating_at IS 'Timestamp of most recent rating';

-- ============================================================================
-- 3. TRIGGER FUNCTION: CALCULATE OVERALL RATING
-- ============================================================================

CREATE OR REPLACE FUNCTION calculate_overall_rating()
RETURNS TRIGGER AS $$
BEGIN
  -- Calculate average of the four dimensional ratings
  NEW.overall_rating := ROUND(
    (NEW.quality_rating + NEW.professionalism_rating + NEW.timeliness_rating + NEW.communication_rating) / 4.0,
    2
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically calculate overall_rating before insert/update
DROP TRIGGER IF EXISTS trigger_calculate_overall_rating ON public.job_ratings;
CREATE TRIGGER trigger_calculate_overall_rating
  BEFORE INSERT OR UPDATE ON public.job_ratings
  FOR EACH ROW
  EXECUTE FUNCTION calculate_overall_rating();

COMMENT ON FUNCTION calculate_overall_rating() IS 'Automatically calculates overall_rating as average of dimensional ratings';

-- ============================================================================
-- 4. TRIGGER FUNCTION: UPDATE TECHNICIAN STATS
-- ============================================================================

CREATE OR REPLACE FUNCTION update_technician_stats()
RETURNS TRIGGER AS $$
BEGIN
  -- Update technician statistics based on all their ratings
  UPDATE public.technicians
  SET
    average_rating = (
      SELECT ROUND(AVG(overall_rating), 2)
      FROM public.job_ratings
      WHERE technician_id = NEW.technician_id
    ),
    total_ratings = (
      SELECT COUNT(*)
      FROM public.job_ratings
      WHERE technician_id = NEW.technician_id
    ),
    jobs_completed = (
      SELECT COUNT(DISTINCT job_id)
      FROM public.job_ratings
      WHERE technician_id = NEW.technician_id
    ),
    last_rating_at = NEW.created_at
  WHERE id = NEW.technician_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update technician stats after rating insert/update
DROP TRIGGER IF EXISTS trigger_update_technician_stats ON public.job_ratings;
CREATE TRIGGER trigger_update_technician_stats
  AFTER INSERT OR UPDATE ON public.job_ratings
  FOR EACH ROW
  EXECUTE FUNCTION update_technician_stats();

COMMENT ON FUNCTION update_technician_stats() IS 'Automatically updates technician performance statistics when ratings are added or changed';

-- ============================================================================
-- 5. HELPER FUNCTION: GET TECHNICIAN RATING BREAKDOWN
-- ============================================================================

CREATE OR REPLACE FUNCTION get_technician_rating_breakdown(tech_id UUID)
RETURNS TABLE (
  avg_quality DECIMAL(3, 2),
  avg_professionalism DECIMAL(3, 2),
  avg_timeliness DECIMAL(3, 2),
  avg_communication DECIMAL(3, 2),
  avg_overall DECIMAL(3, 2),
  total_ratings INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    ROUND(AVG(quality_rating), 2) as avg_quality,
    ROUND(AVG(professionalism_rating), 2) as avg_professionalism,
    ROUND(AVG(timeliness_rating), 2) as avg_timeliness,
    ROUND(AVG(communication_rating), 2) as avg_communication,
    ROUND(AVG(overall_rating), 2) as avg_overall,
    COUNT(*)::INTEGER as total_ratings
  FROM public.job_ratings
  WHERE technician_id = tech_id;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_technician_rating_breakdown(UUID) IS 'Returns detailed rating breakdown for a technician (average for each dimension)';

-- ============================================================================
-- 6. ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS
ALTER TABLE public.job_ratings ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view ratings for jobs in their organization
CREATE POLICY "Users can view ratings in their org"
  ON public.job_ratings
  FOR SELECT
  USING (
    org_id IN (
      SELECT org_id FROM public.org_members WHERE user_id = auth.uid()
    )
  );

-- Policy: Users can insert ratings for jobs in their organization
CREATE POLICY "Users can create ratings in their org"
  ON public.job_ratings
  FOR INSERT
  WITH CHECK (
    org_id IN (
      SELECT org_id FROM public.org_members WHERE user_id = auth.uid()
    )
  );

-- Policy: Users can update their own ratings
CREATE POLICY "Users can update their own ratings"
  ON public.job_ratings
  FOR UPDATE
  USING (rated_by = auth.uid())
  WITH CHECK (rated_by = auth.uid());

-- Policy: Admins can do anything with ratings in their org
CREATE POLICY "Admins can manage ratings in their org"
  ON public.job_ratings
  FOR ALL
  USING (
    org_id IN (
      SELECT om.org_id
      FROM public.org_members om
      INNER JOIN public.admins a ON a.user_id = om.user_id
      WHERE om.user_id = auth.uid()
    )
  );

-- ============================================================================
-- 7. GRANT PERMISSIONS
-- ============================================================================

-- Grant necessary permissions to authenticated users
GRANT SELECT, INSERT, UPDATE ON public.job_ratings TO authenticated;
GRANT USAGE ON SEQUENCE job_ratings_id_seq TO authenticated;

-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION get_technician_rating_breakdown(UUID) TO authenticated;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

-- Summary of changes:
-- 1. Created job_ratings table with dimensional ratings (quality, professionalism, timeliness, communication)
-- 2. Added performance tracking columns to technicians table (average_rating, total_ratings, jobs_completed, last_rating_at)
-- 3. Created trigger to automatically calculate overall_rating from dimensional ratings
-- 4. Created trigger to automatically update technician stats when ratings are added/changed
-- 5. Created helper function to get detailed rating breakdown for technicians
-- 6. Configured RLS policies for secure access control
-- 7. Granted appropriate permissions to authenticated users
