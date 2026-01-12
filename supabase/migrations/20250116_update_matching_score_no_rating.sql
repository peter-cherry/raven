-- Ensure unique pair for job and technician to prevent duplicates
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'uniq_job_candidates_job_tech'
  ) THEN
    CREATE UNIQUE INDEX uniq_job_candidates_job_tech ON job_candidates(job_id, technician_id);
  END IF;
END $$;

-- Replace RPC: compute distance using haversine and score purely by distance (no rating)
DROP FUNCTION IF EXISTS find_matching_technicians(UUID) CASCADE;

CREATE OR REPLACE FUNCTION find_matching_technicians(
  p_job_id UUID,
  p_lat DECIMAL DEFAULT NULL,
  p_lng DECIMAL DEFAULT NULL,
  p_trade TEXT DEFAULT NULL,
  p_state TEXT DEFAULT NULL,
  p_max_distance_m NUMERIC DEFAULT 50000
) RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  v_org_id UUID;
  v_trade TEXT;
  v_job_lat DOUBLE PRECISION;
  v_job_lng DOUBLE PRECISION;
BEGIN
  SELECT org_id, trade_needed, lat::DOUBLE PRECISION, lng::DOUBLE PRECISION
  INTO v_org_id, v_trade, v_job_lat, v_job_lng
  FROM jobs
  WHERE id = p_job_id;

  IF NOT FOUND THEN
    RETURN;
  END IF;

  -- Optional overrides from parameters
  IF p_trade IS NOT NULL THEN
    v_trade := p_trade;
  END IF;
  IF p_lat IS NOT NULL AND p_lng IS NOT NULL THEN
    v_job_lat := p_lat::DOUBLE PRECISION;
    v_job_lng := p_lng::DOUBLE PRECISION;
  END IF;

  -- Insert/Upsert candidates with computed distance/duration and distance-only score
  INSERT INTO job_candidates (org_id, job_id, technician_id, distance_m, duration_sec, match_score, created_at, updated_at)
  SELECT
    t.org_id,
    p_job_id,
    t.id,
    -- Haversine distance in meters
    (2 * 6371000 * ASIN(
      SQRT(
        POWER(SIN(((t.lat::DOUBLE PRECISION - v_job_lat) * PI() / 180) / 2), 2) +
        COS(v_job_lat * PI() / 180) * COS(t.lat::DOUBLE PRECISION * PI() / 180) *
        POWER(SIN(((t.lng::DOUBLE PRECISION - v_job_lng) * PI() / 180) / 2), 2)
      )
    )) AS distance_m,
    -- Rough driving duration assuming ~40 km/h
    ((2 * 6371000 * ASIN(
      SQRT(
        POWER(SIN(((t.lat::DOUBLE PRECISION - v_job_lat) * PI() / 180) / 2), 2) +
        COS(v_job_lat * PI() / 180) * COS(t.lat::DOUBLE PRECISION * PI() / 180) *
        POWER(SIN(((t.lng::DOUBLE PRECISION - v_job_lng) * PI() / 180) / 2), 2)
      )
    )) / 1000) * (3600 / 40.0) AS duration_sec,
    -- Score: purely distance-based in [0,1]
    GREATEST(0, 1 - LEAST(
      (2 * 6371000 * ASIN(
        SQRT(
          POWER(SIN(((t.lat::DOUBLE PRECISION - v_job_lat) * PI() / 180) / 2), 2) +
          COS(v_job_lat * PI() / 180) * COS(t.lat::DOUBLE PRECISION * PI() / 180) *
          POWER(SIN(((t.lng::DOUBLE PRECISION - v_job_lng) * PI() / 180) / 2), 2)
        )
      )), p_max_distance_m) / NULLIF(p_max_distance_m, 0)
    )) AS match_score,
    now(), now()
  FROM technicians t
  WHERE t.org_id = v_org_id
    AND t.trade_needed = v_trade
    AND t.is_available = true
    AND t.lat IS NOT NULL AND t.lng IS NOT NULL
  ON CONFLICT (job_id, technician_id)
  DO UPDATE SET
    distance_m = EXCLUDED.distance_m,
    duration_sec = EXCLUDED.duration_sec,
    match_score = EXCLUDED.match_score,
    updated_at = now();
END
$$;
