-- =====================================================
-- AGENT CONFIGURATION TABLE
-- Stores system prompts and other agent configuration
-- =====================================================

CREATE TABLE agent_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Configuration key (unique identifier)
  config_key TEXT NOT NULL UNIQUE CHECK (config_key IN ('system_prompt', 'model_settings', 'tool_settings')),

  -- Configuration value (JSONB for flexibility)
  config_value JSONB NOT NULL DEFAULT '{}'::jsonb,

  -- System prompt specific fields
  prompt_template TEXT, -- For 'system_prompt' config only

  -- Version tracking
  version INTEGER DEFAULT 1,

  -- Audit fields
  created_by TEXT DEFAULT 'system',
  updated_by TEXT DEFAULT 'system',

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- AUDIT LOG FOR CONFIG CHANGES
-- =====================================================

CREATE TABLE agent_config_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  config_id UUID REFERENCES agent_config(id) ON DELETE CASCADE,
  config_key TEXT NOT NULL,

  -- Old and new values
  old_value JSONB,
  new_value JSONB,
  old_prompt_template TEXT,
  new_prompt_template TEXT,

  -- Who changed it and why
  changed_by TEXT NOT NULL,
  change_reason TEXT,

  version INTEGER NOT NULL,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- INDEXES
-- =====================================================

CREATE INDEX idx_agent_config_key ON agent_config(config_key);
CREATE INDEX idx_agent_config_history_config_id ON agent_config_history(config_id);
CREATE INDEX idx_agent_config_history_created ON agent_config_history(created_at DESC);

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Auto-increment version and log changes
CREATE OR REPLACE FUNCTION log_agent_config_changes()
RETURNS TRIGGER AS $$
BEGIN
  -- Increment version
  NEW.version := OLD.version + 1;
  NEW.updated_at := NOW();

  -- Log the change
  INSERT INTO agent_config_history (
    config_id,
    config_key,
    old_value,
    new_value,
    old_prompt_template,
    new_prompt_template,
    changed_by,
    version
  ) VALUES (
    NEW.id,
    NEW.config_key,
    OLD.config_value,
    NEW.config_value,
    OLD.prompt_template,
    NEW.prompt_template,
    NEW.updated_by,
    NEW.version
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER log_config_updates
  BEFORE UPDATE ON agent_config
  FOR EACH ROW
  EXECUTE FUNCTION log_agent_config_changes();

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

-- Get current system prompt
CREATE OR REPLACE FUNCTION get_system_prompt()
RETURNS TEXT AS $$
DECLARE
  prompt TEXT;
BEGIN
  SELECT prompt_template INTO prompt
  FROM agent_config
  WHERE config_key = 'system_prompt';

  -- Return default if not set
  IF prompt IS NULL THEN
    RETURN 'You are Raven Agent, a persistent autonomous development assistant for Raven Search.';
  END IF;

  RETURN prompt;
END;
$$ LANGUAGE plpgsql;

-- Update system prompt with versioning
CREATE OR REPLACE FUNCTION update_system_prompt(
  new_prompt TEXT,
  updated_by_user TEXT DEFAULT 'user',
  reason TEXT DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
  config_id UUID;
  new_version INTEGER;
BEGIN
  -- Get existing config
  SELECT id INTO config_id
  FROM agent_config
  WHERE config_key = 'system_prompt';

  IF config_id IS NULL THEN
    -- Create new config
    INSERT INTO agent_config (
      config_key,
      prompt_template,
      updated_by
    ) VALUES (
      'system_prompt',
      new_prompt,
      updated_by_user
    )
    RETURNING id, version INTO config_id, new_version;
  ELSE
    -- Update existing
    UPDATE agent_config
    SET
      prompt_template = new_prompt,
      updated_by = updated_by_user
    WHERE config_key = 'system_prompt'
    RETURNING version INTO new_version;
  END IF;

  RETURN json_build_object(
    'success', true,
    'config_id', config_id,
    'version', new_version,
    'updated_by', updated_by_user
  );
END;
$$ LANGUAGE plpgsql;

-- Get prompt history
CREATE OR REPLACE FUNCTION get_prompt_history(limit_count INTEGER DEFAULT 10)
RETURNS TABLE(
  version INTEGER,
  prompt_template TEXT,
  changed_by TEXT,
  change_reason TEXT,
  changed_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    h.version,
    h.new_prompt_template as prompt_template,
    h.changed_by,
    h.change_reason,
    h.created_at as changed_at
  FROM agent_config_history h
  JOIN agent_config c ON c.id = h.config_id
  WHERE c.config_key = 'system_prompt'
  ORDER BY h.created_at DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- INITIAL DATA
-- =====================================================

-- Insert default system prompt
INSERT INTO agent_config (
  config_key,
  prompt_template,
  config_value,
  created_by
) VALUES (
  'system_prompt',
  'You are Raven Agent, working AUTONOMOUSLY on development tasks.

**CURRENT WORK ITEM:**
Title: ${workItem.title}
Description: ${workItem.description}
Status: ${workItem.status}
Progress: ${workItem.progress_percentage}%

**COMPLETION CRITERIA:**
${JSON.stringify(workItem.completion_criteria, null, 2)}

**IMPLEMENTATION PLAN:**
${JSON.stringify(workItem.implementation_plan, null, 2)}

**AUTONOMOUS OPERATION RULES:**
1. You are working independently - no human is watching
2. Make actual progress on the task
3. Update completion criteria as you complete them
4. If you complete a criterion, respond with: CRITERION_COMPLETE: [criterion text]
5. If you''re blocked, respond with: BLOCKED: [reason]
6. Provide a brief status update of what you accomplished
7. Be concise - focus on ACTION not explanation

**YOUR CAPABILITIES:**

File System:
- read_file: Read any file from the codebase
- write_file: Create or overwrite files
- bash_command: Execute bash commands (git, npm, test, etc.)
- list_files: List files in a directory

Database (Supabase):
- supabase_list_tables: List all database tables
- supabase_execute_sql: Run SQL queries to read data
- supabase_apply_migration: Create/modify database schema
- supabase_get_advisors: Check security and performance issues

Deployment (Vercel):
- vercel_list_deployments: List recent deployments
- vercel_get_deployment_logs: Get build logs to debug failures

**IMPORTANT:**
- Use tools to make ACTUAL progress, not just plan
- When you complete a file change, respond with: CRITERION_COMPLETE: [criterion text]
- When blocked, respond with: BLOCKED: [reason]
- Be autonomous - you can:
  * Read and modify files
  * Run tests and git commands
  * Query the database to understand data
  * Apply database migrations
  * Check deployment status and logs

What specific action will you take right now to move this task forward?',
  jsonb_build_object(
    'description', 'Default autonomous agent system prompt',
    'variables_available', array['workItem.title', 'workItem.description', 'workItem.status', 'workItem.progress_percentage', 'workItem.completion_criteria', 'workItem.implementation_plan']
  ),
  'system'
);

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON TABLE agent_config IS 'Stores agent configuration including system prompts and settings';
COMMENT ON TABLE agent_config_history IS 'Audit log of all configuration changes with full history';
COMMENT ON FUNCTION get_system_prompt() IS 'Retrieves the current active system prompt';
COMMENT ON FUNCTION update_system_prompt(TEXT, TEXT, TEXT) IS 'Updates system prompt with versioning and audit trail';
COMMENT ON FUNCTION get_prompt_history(INTEGER) IS 'Returns version history of system prompt changes';
