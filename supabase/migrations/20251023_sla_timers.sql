-- SLA (Service Level Agreement) Timers System
-- Tracks dispatch, assignment, arrival, and completion timers for jobs

-- Add SLA configuration to jobs table
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS sla_config JSONB;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS sla_started_at TIMESTAMPTZ;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS sla_breached BOOLEAN DEFAULT FALSE;

-- SLA timer stages and their states
CREATE TABLE sla_timers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  stage TEXT NOT NULL, -- 'dispatch', 'assignment', 'arrival', 'completion'
  target_minutes INTEGER NOT NULL,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  breached BOOLEAN DEFAULT FALSE,
  breach_time TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- SLA alerts and escalations
CREATE TABLE sla_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  timer_id UUID REFERENCES sla_timers(id) ON DELETE SET NULL,
  alert_type TEXT NOT NULL, -- 'warning', 'breach', 'escalation'
  stage TEXT NOT NULL,
  message TEXT,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  acknowledged BOOLEAN DEFAULT FALSE,
  acknowledged_at TIMESTAMPTZ,
  acknowledged_by UUID REFERENCES auth.users(id)
);

-- Indexes for performance
CREATE INDEX idx_sla_timers_job ON sla_timers(job_id);
CREATE INDEX idx_sla_timers_stage ON sla_timers(stage);
CREATE INDEX idx_sla_timers_active ON sla_timers(job_id) WHERE completed_at IS NULL;
CREATE INDEX idx_sla_timers_breached ON sla_timers(breached) WHERE breached = TRUE;
CREATE INDEX idx_sla_alerts_job ON sla_alerts(job_id);
CREATE INDEX idx_sla_alerts_unack ON sla_alerts(acknowledged) WHERE acknowledged = FALSE;

-- RLS Policies
ALTER TABLE sla_timers ENABLE ROW LEVEL SECURITY;
ALTER TABLE sla_alerts ENABLE ROW LEVEL SECURITY;

-- Users can view SLA timers for jobs in their organization
CREATE POLICY "Users can view sla_timers in their org"
  ON sla_timers FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM jobs j
      INNER JOIN org_memberships om ON j.org_id = om.org_id
      WHERE j.id = sla_timers.job_id
        AND om.user_id = auth.uid()
    )
  );

-- Users can view SLA alerts for jobs in their organization
CREATE POLICY "Users can view sla_alerts in their org"
  ON sla_alerts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM jobs j
      INNER JOIN org_memberships om ON j.org_id = om.org_id
      WHERE j.id = sla_alerts.job_id
        AND om.user_id = auth.uid()
    )
  );

-- Users can acknowledge alerts
CREATE POLICY "Users can acknowledge sla_alerts"
  ON sla_alerts FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM jobs j
      INNER JOIN org_memberships om ON j.org_id = om.org_id
      WHERE j.id = sla_alerts.job_id
        AND om.user_id = auth.uid()
    )
  );

-- Helper function to get SLA status for a job
CREATE OR REPLACE FUNCTION get_sla_status(p_job_id UUID)
RETURNS TABLE (
  stage TEXT,
  status TEXT,
  minutes_remaining NUMERIC,
  progress_percent NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    t.stage,
    CASE
      WHEN t.completed_at IS NOT NULL THEN 'completed'
      WHEN t.breached THEN 'breached'
      WHEN EXTRACT(EPOCH FROM (NOW() - t.started_at)) / 60 > t.target_minutes * 0.75 THEN 'warning'
      ELSE 'on-time'
    END as status,
    GREATEST(0, t.target_minutes - EXTRACT(EPOCH FROM (NOW() - t.started_at)) / 60) as minutes_remaining,
    LEAST(100, (EXTRACT(EPOCH FROM (NOW() - t.started_at)) / 60) / NULLIF(t.target_minutes, 0) * 100) as progress_percent
  FROM sla_timers t
  WHERE t.job_id = p_job_id
  ORDER BY
    CASE t.stage
      WHEN 'dispatch' THEN 1
      WHEN 'assignment' THEN 2
      WHEN 'arrival' THEN 3
      WHEN 'completion' THEN 4
    END;
END;
$$ LANGUAGE plpgsql;

-- Helper function to initialize SLA timers for a job
CREATE OR REPLACE FUNCTION initialize_sla_timers(
  p_job_id UUID,
  p_dispatch_minutes INT,
  p_assignment_minutes INT,
  p_arrival_minutes INT,
  p_completion_minutes INT
)
RETURNS VOID AS $$
BEGIN
  -- Update job with SLA config
  UPDATE jobs
  SET
    sla_config = jsonb_build_object(
      'dispatch', p_dispatch_minutes,
      'assignment', p_assignment_minutes,
      'arrival', p_arrival_minutes,
      'completion', p_completion_minutes
    ),
    sla_started_at = NOW()
  WHERE id = p_job_id;

  -- Create dispatch timer (starts immediately)
  INSERT INTO sla_timers (job_id, stage, target_minutes, started_at)
  VALUES (p_job_id, 'dispatch', p_dispatch_minutes, NOW());

  -- Other timers will be created when previous stage completes
END;
$$ LANGUAGE plpgsql;

-- Helper function to complete an SLA stage and start the next
CREATE OR REPLACE FUNCTION complete_sla_stage(
  p_job_id UUID,
  p_current_stage TEXT
)
RETURNS VOID AS $$
DECLARE
  v_sla_config JSONB;
  v_next_stage TEXT;
  v_next_minutes INT;
BEGIN
  -- Mark current stage as completed
  UPDATE sla_timers
  SET completed_at = NOW()
  WHERE job_id = p_job_id
    AND stage = p_current_stage
    AND completed_at IS NULL;

  -- Get SLA config
  SELECT sla_config INTO v_sla_config
  FROM jobs
  WHERE id = p_job_id;

  -- Determine next stage
  v_next_stage := CASE p_current_stage
    WHEN 'dispatch' THEN 'assignment'
    WHEN 'assignment' THEN 'arrival'
    WHEN 'arrival' THEN 'completion'
    ELSE NULL
  END;

  -- Start next stage if exists
  IF v_next_stage IS NOT NULL AND v_sla_config IS NOT NULL THEN
    v_next_minutes := (v_sla_config->>v_next_stage)::INT;

    INSERT INTO sla_timers (job_id, stage, target_minutes, started_at)
    VALUES (p_job_id, v_next_stage, v_next_minutes, NOW());
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_sla_timers_updated_at
  BEFORE UPDATE ON sla_timers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
