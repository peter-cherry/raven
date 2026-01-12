-- Universal CMMS Integration System
-- Migration: 20250117_universal_integration_schema.sql
-- Purpose: Add tables for universal integration with any CMMS platform

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- TABLE: integration_platforms
-- Stores discovered platform configurations (MaintainX, Corrigo, etc.)
-- ============================================================================
CREATE TABLE IF NOT EXISTS integration_platforms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Platform identification
  name TEXT UNIQUE NOT NULL, -- 'maintainx', 'corrigo', 'servicetitan'
  display_name TEXT NOT NULL, -- 'MaintainX', 'Corrigo', 'ServiceTitan'

  -- API configuration
  api_base_url TEXT NOT NULL,
  api_docs_url TEXT,
  api_version TEXT,

  -- Authentication configuration (JSONB for flexibility)
  auth_config JSONB NOT NULL,
  -- Example: { "type": "bearer", "header_name": "Authorization" }
  -- Example: { "type": "oauth2", "authorize_url": "...", "token_url": "..." }

  -- API endpoints mapping (JSONB for flexibility)
  endpoints JSONB NOT NULL,
  -- Example: {
  --   "technicians": { "list": { "method": "GET", "path": "/users" } },
  --   "workOrders": { "list": { "method": "GET", "path": "/workorders" } }
  -- }

  -- Schema mapping (discovered field mappings)
  schema_mapping JSONB DEFAULT '{}',
  -- Example: {
  --   "technician": {
  --     "id": "id",
  --     "firstName": "name",
  --     "email": "email",
  --     "phoneNumber": "phone"
  --   }
  -- }

  -- Platform capabilities
  webhooks_supported BOOLEAN DEFAULT FALSE,
  rate_limits JSONB,
  -- Example: { "requests_per_hour": 1000, "requests_per_minute": 60 }

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- TABLE: integration_credentials
-- Stores encrypted credentials for each user's connected platforms
-- ============================================================================
CREATE TABLE IF NOT EXISTS integration_credentials (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- References
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  platform_id UUID NOT NULL REFERENCES integration_platforms(id) ON DELETE CASCADE,

  -- Encrypted credentials (JSONB for flexibility)
  credentials JSONB NOT NULL,
  -- Example for API Key: { "api_key": "encrypted_value" }
  -- Example for OAuth: { "access_token": "...", "refresh_token": "...", "expires_at": "..." }

  -- Connection status
  connection_status TEXT DEFAULT 'active' CHECK (connection_status IN ('active', 'expired', 'revoked', 'error')),
  last_tested_at TIMESTAMPTZ,
  last_sync_at TIMESTAMPTZ,

  -- Error tracking
  last_error TEXT,
  error_count INTEGER DEFAULT 0,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Unique constraint: one credential per user per platform
  UNIQUE(user_id, platform_id)
);

-- ============================================================================
-- TABLE: integration_sync_logs
-- Tracks all sync operations for monitoring and debugging
-- ============================================================================
CREATE TABLE IF NOT EXISTS integration_sync_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- References
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  platform_name TEXT NOT NULL,

  -- Operation details
  operation TEXT NOT NULL,
  -- Examples: 'import_technicians', 'sync_work_order', 'test_connection', 'discover_platform'

  status TEXT NOT NULL CHECK (status IN ('success', 'error', 'partial', 'in_progress')),

  -- Results
  records_processed INTEGER DEFAULT 0,
  records_successful INTEGER DEFAULT 0,
  records_failed INTEGER DEFAULT 0,

  -- Error information
  error_message TEXT,
  error_details JSONB,

  -- Operation details
  details JSONB,
  -- Example: { "imported_ids": [...], "skipped_count": 5, "duration_ms": 1234 }

  -- Timing
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- UPDATE EXISTING: technicians table
-- Add external_systems mapping to track technician IDs across platforms
-- ============================================================================
DO $$
BEGIN
  -- Add external_systems column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'technicians' AND column_name = 'external_systems'
  ) THEN
    ALTER TABLE technicians ADD COLUMN external_systems JSONB DEFAULT '{}';
  END IF;

  -- Add imported_from column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'technicians' AND column_name = 'imported_from'
  ) THEN
    ALTER TABLE technicians ADD COLUMN imported_from TEXT;
  END IF;

  -- Add imported_at column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'technicians' AND column_name = 'imported_at'
  ) THEN
    ALTER TABLE technicians ADD COLUMN imported_at TIMESTAMPTZ;
  END IF;
END $$;

-- Add comment explaining external_systems structure
COMMENT ON COLUMN technicians.external_systems IS 'Maps platform names to external IDs. Example: {"maintainx": "1178852", "corrigo": "provider_12345"}';

-- ============================================================================
-- UPDATE EXISTING: jobs table
-- Add CMMS sync fields to track which jobs are synced to external platforms
-- ============================================================================
DO $$
BEGIN
  -- Add synced_to_cmms column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'jobs' AND column_name = 'synced_to_cmms'
  ) THEN
    ALTER TABLE jobs ADD COLUMN synced_to_cmms BOOLEAN DEFAULT FALSE;
  END IF;

  -- Add external_job_id column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'jobs' AND column_name = 'external_job_id'
  ) THEN
    ALTER TABLE jobs ADD COLUMN external_job_id TEXT;
  END IF;

  -- Add platform_name column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'jobs' AND column_name = 'platform_name'
  ) THEN
    ALTER TABLE jobs ADD COLUMN platform_name TEXT;
  END IF;

  -- Add external_system_data column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'jobs' AND column_name = 'external_system_data'
  ) THEN
    ALTER TABLE jobs ADD COLUMN external_system_data JSONB DEFAULT '{}';
  END IF;
END $$;

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS on new tables
ALTER TABLE integration_platforms ENABLE ROW LEVEL SECURITY;
ALTER TABLE integration_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE integration_sync_logs ENABLE ROW LEVEL SECURITY;

-- Policy: integration_platforms - Public read access (anyone can see available platforms)
DROP POLICY IF EXISTS "Anyone can view integration platforms" ON integration_platforms;
CREATE POLICY "Anyone can view integration platforms"
  ON integration_platforms
  FOR SELECT
  USING (TRUE);

-- Policy: integration_credentials - Users manage their own credentials
DROP POLICY IF EXISTS "Users manage own integration credentials" ON integration_credentials;
CREATE POLICY "Users manage own integration credentials"
  ON integration_credentials
  FOR ALL
  USING (auth.uid() = user_id);

-- Policy: integration_sync_logs - Users view their own logs
DROP POLICY IF EXISTS "Users view own sync logs" ON integration_sync_logs;
CREATE POLICY "Users view own sync logs"
  ON integration_sync_logs
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Allow service role to insert sync logs
DROP POLICY IF EXISTS "Service role can insert sync logs" ON integration_sync_logs;
CREATE POLICY "Service role can insert sync logs"
  ON integration_sync_logs
  FOR INSERT
  WITH CHECK (TRUE);

-- ============================================================================
-- INDEXES for performance
-- ============================================================================

-- Credentials lookup by user and platform
CREATE INDEX IF NOT EXISTS idx_integration_credentials_user_platform
  ON integration_credentials(user_id, platform_id);

-- Credentials lookup by status
CREATE INDEX IF NOT EXISTS idx_integration_credentials_status
  ON integration_credentials(connection_status);

-- Sync logs by user and operation
CREATE INDEX IF NOT EXISTS idx_integration_sync_logs_user_operation
  ON integration_sync_logs(user_id, operation, created_at DESC);

-- Sync logs by platform
CREATE INDEX IF NOT EXISTS idx_integration_sync_logs_platform
  ON integration_sync_logs(platform_name, created_at DESC);

-- Technicians external systems lookup (JSONB GIN index)
CREATE INDEX IF NOT EXISTS idx_technicians_external_systems
  ON technicians USING GIN (external_systems);

-- Jobs external sync lookup
CREATE INDEX IF NOT EXISTS idx_jobs_external_sync
  ON jobs(platform_name, external_job_id) WHERE synced_to_cmms = TRUE;

-- ============================================================================
-- SEED DATA: Pre-configured platforms
-- ============================================================================

-- Insert MaintainX platform configuration
INSERT INTO integration_platforms (name, display_name, api_base_url, api_docs_url, auth_config, endpoints, rate_limits)
VALUES (
  'maintainx',
  'MaintainX',
  'https://api.getmaintainx.com/v1',
  'https://maintainx.dev/',
  '{"type": "bearer", "header_name": "Authorization"}'::jsonb,
  '{
    "workOrders": {
      "list": {"method": "GET", "path": "/workorders"},
      "get": {"method": "GET", "path": "/workorders/{id}"},
      "create": {"method": "POST", "path": "/workorders"},
      "update": {"method": "PATCH", "path": "/workorders/{id}"}
    },
    "users": {
      "list": {"method": "GET", "path": "/users"},
      "get": {"method": "GET", "path": "/users/{id}"}
    },
    "assets": {
      "list": {"method": "GET", "path": "/assets"},
      "get": {"method": "GET", "path": "/assets/{id}"}
    }
  }'::jsonb,
  '{"requests_per_minute": 60, "requests_per_hour": 1000}'::jsonb
)
ON CONFLICT (name) DO UPDATE SET
  api_base_url = EXCLUDED.api_base_url,
  endpoints = EXCLUDED.endpoints,
  updated_at = NOW();

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to update updated_at timestamp automatically
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers for updated_at
DROP TRIGGER IF EXISTS update_integration_platforms_updated_at ON integration_platforms;
CREATE TRIGGER update_integration_platforms_updated_at
  BEFORE UPDATE ON integration_platforms
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_integration_credentials_updated_at ON integration_credentials;
CREATE TRIGGER update_integration_credentials_updated_at
  BEFORE UPDATE ON integration_credentials
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- COMPLETED
-- ============================================================================

COMMENT ON TABLE integration_platforms IS 'Stores discovered CMMS platform configurations';
COMMENT ON TABLE integration_credentials IS 'Stores encrypted user credentials for connected platforms';
COMMENT ON TABLE integration_sync_logs IS 'Tracks all integration sync operations for monitoring';
