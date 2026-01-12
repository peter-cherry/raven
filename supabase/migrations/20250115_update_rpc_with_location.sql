-- Drop existing function
DROP FUNCTION IF EXISTS find_matching_technicians(UUID) CASCADE;

-- Updated Find Matching Technicians RPC with location parameters
CREATE OR REPLACE FUNCTION find_matching_technicians(
  p_job_id UUID,
  p_lat DECIMAL DEFAULT NULL,
  p_lng DECIMAL DEFAULT NULL,
  p_trade TEXT DEFAULT NULL,
  p_state TEXT DEFAULT NULL,
  p_max_distance_m NUMERIC DEFAULT 50000
)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  v_job_trade TEXT;
  v_org_id UUID;
  v_technician_id UUID;
  v_distance_m NUMERIC;
  v_duration_sec NUMERIC;
BEGIN
  -- Get job details if trade not provided
  SELECT trade_needed, org_id INTO v_job_trade, v_org_id
  FROM jobs
  WHERE id = p_job_id;
  
  IF NOT FOUND THEN
    RETURN;
  END IF;

  -- Use provided trade or job trade
  IF p_trade IS NOT NULL THEN
    v_job_trade := p_trade;
  END IF;

  -- Find technicians matching the trade and organization
  FOR v_technician_id IN
    SELECT id
    FROM technicians
    WHERE org_id = v_org_id
      AND trade_needed = v_job_trade
      AND is_available = true
    LIMIT 10
  LOOP
    -- Use placeholder distance/duration (in production, use PostGIS or Google Maps API)
    v_distance_m := (random() * p_max_distance_m)::NUMERIC;
    v_duration_sec := (v_distance_m / 1000 * 3)::NUMERIC;
    
    -- Insert into job_candidates with org_id
    INSERT INTO job_candidates (org_id, job_id, technician_id, distance_m, duration_sec, match_score)
    VALUES (v_org_id, p_job_id, v_technician_id, v_distance_m, v_duration_sec, 0.8)
    ON CONFLICT DO NOTHING;
  END LOOP;
END
$$;
