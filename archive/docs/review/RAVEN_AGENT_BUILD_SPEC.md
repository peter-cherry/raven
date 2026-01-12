> Archived on 2026-01-12 from RAVEN_AGENT_BUILD_SPEC.md. Reason: Review needed - may contain active specifications

# 🤖 RAVEN AGENT - PERSISTENT DEVELOPMENT ASSISTANT
## Complete Implementation Specification for Claude Code

**Last Updated:** January 15, 2025
**Project:** Raven Search
**Author:** Peter (via Claude)

---

## 📋 TABLE OF CONTENTS

1. [System Overview](#system-overview)
2. [Architecture](#architecture)
3. [Database Schema](#database-schema)
4. [API Routes](#api-routes)
5. [UI Components](#ui-components)
6. [MCP Server](#mcp-server)
7. [Autonomous Agent](#autonomous-agent)
8. [Deployment](#deployment)
9. [Usage Examples](#usage-examples)

---

## 🎯 SYSTEM OVERVIEW

### What We're Building

**Raven Agent** is a persistent, autonomous development assistant that:

1. ✅ **Never forgets** - Full context preservation across sessions
2. ✅ **Tracks to completion** - Criteria-based progress tracking
3. ✅ **Self-validates** - Checks work before marking done
4. ✅ **Autonomous** - Can work independently and report back
5. ✅ **Integrated** - Connects to Sentry, GitHub, Supabase

### Core Philosophy

> "A task isn't done until it's tested, documented, and deployed. The agent doesn't rest until ALL completion criteria are met."

### Key Features

- **Work Queue Management** - Prioritized task tracking
- **Chat Interface** - Discuss implementation with full context
- **Session Tracking** - Every work session is logged
- **Completion Criteria** - Clear, verifiable goals
- **Autonomous Monitoring** - Agent checks in daily
- **MCP Integration** - Full codebase access via Claude Code

---

## 🏗️ ARCHITECTURE

```
┌─────────────────────────────────────────────────────────┐
│                    RAVEN AGENT SYSTEM                   │
└─────────────────────────────────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        ▼                   ▼                   ▼
   ┌─────────┐        ┌──────────┐       ┌──────────┐
   │  STATE  │        │ CHAT UI  │       │   MCP    │
   │  STORE  │◄──────►│ /admin/  │◄─────►│  SERVER  │
   │(Supabase│        │  agent   │       │ (Claude) │
   └─────────┘        └──────────┘       └──────────┘
        │                   │                   │
        │                   │                   │
        ▼                   ▼                   ▼
   [Database]          [Chat API]         [File System]
   [Sessions]          [Claude API]       [GitHub]
   [Criteria]          [Artifacts]        [Sentry]
```

### Tech Stack

- **Frontend:** Next.js 15, React 19, TypeScript, Tailwind CSS v4
- **Backend:** Supabase (PostgreSQL + Edge Functions)
- **AI:** Claude Sonnet 4 via Anthropic API
- **Integration:** MCP Servers for Claude Code
- **Monitoring:** Sentry for error tracking

---

## 🗄️ DATABASE SCHEMA

### File: `supabase/migrations/20250115_raven_agent.sql`

```sql
-- =====================================================
-- RAVEN AGENT - PERSISTENT DEVELOPMENT ASSISTANT
-- Database Schema for Work Tracking & Context Storage
-- =====================================================

-- =====================================================
-- WORK ITEMS (Main tracking table)
-- =====================================================

CREATE TABLE work_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Core information
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('bug', 'feature', 'refactor', 'tech_debt', 'documentation')),
  priority TEXT NOT NULL CHECK (priority IN ('critical', 'high', 'medium', 'low')),

  -- Status tracking with granular substatus
  status TEXT DEFAULT 'pending' CHECK (status IN (
    'pending',      -- Not started
    'analyzing',    -- Understanding requirements
    'planning',     -- Creating implementation plan
    'implementing', -- Writing code
    'testing',      -- Running tests
    'reviewing',    -- Self-review
    'blocked',      -- Stuck on something
    'completed'     -- Done and verified
  )),

  -- Completion criteria (ALL must be met before done)
  completion_criteria JSONB NOT NULL DEFAULT '[]'::jsonb,
  -- Example structure:
  -- [
  --   {"criterion": "Database migration created", "completed": false, "completed_at": null},
  --   {"criterion": "API routes implemented", "completed": true, "completed_at": "2025-01-15T10:30:00Z"},
  --   {"criterion": "Unit tests written and passing", "completed": false, "completed_at": null},
  --   {"criterion": "Documentation updated", "completed": false, "completed_at": null},
  --   {"criterion": "Deployed to production", "completed": false, "completed_at": null}
  -- ]

  -- Implementation plan (step-by-step)
  implementation_plan JSONB DEFAULT '{}'::jsonb,
  -- Example structure:
  -- {
  --   "steps": [
  --     {"step": 1, "description": "Create database schema", "status": "completed", "notes": "Migration file created"},
  --     {"step": 2, "description": "Build API endpoints", "status": "in_progress", "notes": "2 of 3 routes done"},
  --     {"step": 3, "description": "Create UI components", "status": "pending", "notes": null}
  --   ],
  --   "technical_notes": "Using Supabase RLS for permissions",
  --   "dependencies": ["work-item-uuid-1", "work-item-uuid-2"]
  -- }

  -- Context preservation (everything needed to resume)
  context JSONB DEFAULT '{}'::jsonb,
  -- Example structure:
  -- {
  --   "files_involved": ["app/api/jobs/route.ts", "supabase/migrations/001.sql"],
  --   "key_decisions": ["Using Redis for caching", "Postgres full-text search"],
  --   "blockers": [],
  --   "next_steps": ["Write integration tests", "Update API docs"],
  --   "research_done": ["Investigated 3 libraries", "Chose X because Y"],
  --   "environment_setup": {"env_vars": ["REDIS_URL"], "services": ["redis"]}
  -- }

  -- File tracking
  related_files TEXT[] DEFAULT '{}',
  branch_name TEXT,

  -- Dependencies
  depends_on UUID[], -- Other work_items this depends on
  blocks UUID[], -- Work_items that depend on this

  -- Blocking information
  blocked_reason TEXT,
  blocked_at TIMESTAMPTZ,
  unblocked_at TIMESTAMPTZ,

  -- External links
  github_issue_url TEXT,
  github_pr_url TEXT,
  sentry_issue_id TEXT,
  slack_thread_url TEXT,

  -- Progress tracking
  estimated_effort_hours INTEGER,
  time_spent_minutes INTEGER DEFAULT 0,
  progress_percentage INTEGER DEFAULT 0,

  -- Assignment
  assigned_to TEXT DEFAULT 'raven-agent',

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Metadata (extensible)
  metadata JSONB DEFAULT '{}'::jsonb,

  -- Tags for categorization
  tags TEXT[] DEFAULT '{}'
);

-- =====================================================
-- WORK SESSIONS (Track each work session)
-- =====================================================

CREATE TABLE work_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  work_item_id UUID REFERENCES work_items(id) ON DELETE CASCADE,

  -- Session timing
  started_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  duration_minutes INTEGER,

  -- What happened during this session
  summary TEXT, -- Human-readable summary
  actions_taken JSONB DEFAULT '[]'::jsonb,
  -- Example: [
  --   {"action": "created_file", "file": "api/route.ts", "timestamp": "..."},
  --   {"action": "ran_migration", "migration": "001_add_favorites.sql", "success": true},
  --   {"action": "ran_tests", "passed": 15, "failed": 2}
  -- ]

  -- File modifications
  files_created TEXT[] DEFAULT '{}',
  files_modified TEXT[] DEFAULT '{}',
  files_deleted TEXT[] DEFAULT '{}',

  -- Testing
  tests_run JSONB DEFAULT '{}'::jsonb,
  -- Example: {"total": 50, "passed": 48, "failed": 2, "skipped": 0}

  -- Progress made
  criteria_completed TEXT[], -- Which completion criteria were finished
  blockers_encountered TEXT[] DEFAULT '{}',

  -- Next steps identified
  next_steps TEXT[] DEFAULT '{}',

  -- Conversation/decisions
  key_decisions JSONB DEFAULT '[]'::jsonb,
  questions_raised TEXT[] DEFAULT '{}',

  -- Agent thoughts (for debugging/learning)
  agent_notes TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- CONVERSATION THREADS
-- =====================================================

CREATE TABLE conversation_threads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  work_item_id UUID REFERENCES work_items(id) ON DELETE CASCADE,

  title TEXT NOT NULL,
  active BOOLEAN DEFAULT true,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_message_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE conversation_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id UUID REFERENCES conversation_threads(id) ON DELETE CASCADE,

  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,

  -- Rich content
  artifacts JSONB DEFAULT '[]'::jsonb,
  -- Example: [
  --   {"type": "code", "language": "typescript", "content": "..."},
  --   {"type": "file_created", "path": "api/route.ts"},
  --   {"type": "migration_run", "file": "001.sql", "success": true}
  -- ]

  -- Actions taken by assistant
  actions_performed JSONB DEFAULT '[]'::jsonb,

  -- Token usage tracking
  tokens_used INTEGER,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- DAILY STANDUPS (Autonomous progress reports)
-- =====================================================

CREATE TABLE daily_standups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  date DATE DEFAULT CURRENT_DATE UNIQUE,

  -- Summary counts
  completed_count INTEGER DEFAULT 0,
  in_progress_count INTEGER DEFAULT 0,
  blocked_count INTEGER DEFAULT 0,
  pending_count INTEGER DEFAULT 0,

  -- Detailed tracking
  completed_items UUID[] DEFAULT '{}',
  in_progress_items UUID[] DEFAULT '{}',
  blocked_items UUID[] DEFAULT '{}',

  -- What happened today
  highlights TEXT[] DEFAULT '{}',
  challenges TEXT[] DEFAULT '{}',

  -- Tomorrow's priorities
  next_priorities UUID[] DEFAULT '{}',
  next_actions TEXT[] DEFAULT '{}',

  -- Time tracking
  total_time_spent_minutes INTEGER DEFAULT 0,

  -- Generated report
  report_text TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- AGENT ACTIVITY LOG (For autonomous operation)
-- =====================================================

CREATE TABLE agent_activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  activity_type TEXT NOT NULL CHECK (activity_type IN (
    'work_session_start',
    'work_session_end',
    'status_change',
    'criteria_completed',
    'blocker_encountered',
    'blocker_resolved',
    'daily_standup',
    'error',
    'milestone_reached'
  )),

  work_item_id UUID REFERENCES work_items(id) ON DELETE CASCADE,

  description TEXT NOT NULL,
  details JSONB DEFAULT '{}'::jsonb,

  -- For errors
  error_message TEXT,
  stack_trace TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- INDEXES
-- =====================================================

-- Work items
CREATE INDEX idx_work_items_status ON work_items(status) WHERE status != 'completed';
CREATE INDEX idx_work_items_priority ON work_items(priority);
CREATE INDEX idx_work_items_type ON work_items(type);
CREATE INDEX idx_work_items_assigned ON work_items(assigned_to);
CREATE INDEX idx_work_items_updated ON work_items(updated_at DESC);
CREATE INDEX idx_work_items_tags ON work_items USING GIN(tags);

-- GIN indexes for JSONB searching
CREATE INDEX idx_work_items_criteria ON work_items USING GIN(completion_criteria);
CREATE INDEX idx_work_items_context ON work_items USING GIN(context);
CREATE INDEX idx_work_items_plan ON work_items USING GIN(implementation_plan);

-- Work sessions
CREATE INDEX idx_work_sessions_work_item ON work_sessions(work_item_id);
CREATE INDEX idx_work_sessions_started ON work_sessions(started_at DESC);

-- Conversations
CREATE INDEX idx_conversation_threads_work_item ON conversation_threads(work_item_id);
CREATE INDEX idx_conversation_threads_active ON conversation_threads(active) WHERE active = true;
CREATE INDEX idx_conversation_messages_thread ON conversation_messages(thread_id);
CREATE INDEX idx_conversation_messages_created ON conversation_messages(created_at DESC);

-- Activity log
CREATE INDEX idx_agent_activity_work_item ON agent_activity_log(work_item_id);
CREATE INDEX idx_agent_activity_type ON agent_activity_log(activity_type);
CREATE INDEX idx_agent_activity_created ON agent_activity_log(created_at DESC);

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Update updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_work_items_updated_at
  BEFORE UPDATE ON work_items
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_conversation_threads_updated_at
  BEFORE UPDATE ON conversation_threads
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Auto-calculate progress percentage from completion criteria
CREATE OR REPLACE FUNCTION calculate_progress()
RETURNS TRIGGER AS $$
DECLARE
  total_criteria INTEGER;
  completed_criteria INTEGER;
BEGIN
  -- Count completion criteria
  total_criteria := jsonb_array_length(NEW.completion_criteria);

  -- Count completed criteria
  SELECT COUNT(*)
  INTO completed_criteria
  FROM jsonb_array_elements(NEW.completion_criteria) AS criterion
  WHERE (criterion->>'completed')::boolean = true;

  -- Calculate percentage
  IF total_criteria > 0 THEN
    NEW.progress_percentage := (completed_criteria::float / total_criteria * 100)::integer;
  ELSE
    NEW.progress_percentage := 0;
  END IF;

  -- Auto-complete if all criteria met
  IF completed_criteria = total_criteria AND total_criteria > 0 AND NEW.status != 'completed' THEN
    NEW.status := 'completed';
    NEW.completed_at := NOW();

    -- Log activity
    INSERT INTO agent_activity_log (
      activity_type,
      work_item_id,
      description,
      details
    ) VALUES (
      'milestone_reached',
      NEW.id,
      'Work item completed - all criteria met',
      jsonb_build_object('criteria_count', total_criteria)
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER auto_calculate_progress
  BEFORE UPDATE OF completion_criteria ON work_items
  FOR EACH ROW
  EXECUTE FUNCTION calculate_progress();

-- Log status changes
CREATE OR REPLACE FUNCTION log_status_changes()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO agent_activity_log (
      activity_type,
      work_item_id,
      description,
      details
    ) VALUES (
      'status_change',
      NEW.id,
      format('Status changed from %s to %s', OLD.status, NEW.status),
      jsonb_build_object(
        'old_status', OLD.status,
        'new_status', NEW.status,
        'progress', NEW.progress_percentage
      )
    );

    -- Update started_at if moving from pending
    IF OLD.status = 'pending' AND NEW.status != 'pending' AND NEW.started_at IS NULL THEN
      NEW.started_at := NOW();
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER log_work_item_status_changes
  BEFORE UPDATE OF status ON work_items
  FOR EACH ROW
  EXECUTE FUNCTION log_status_changes();

-- Update last_message_at for conversation threads
CREATE OR REPLACE FUNCTION update_thread_last_message()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE conversation_threads
  SET last_message_at = NEW.created_at
  WHERE id = NEW.thread_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_thread_on_message
  AFTER INSERT ON conversation_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_thread_last_message();

-- =====================================================
-- FUNCTIONS
-- =====================================================

-- Get work queue (what agent should work on)
CREATE OR REPLACE FUNCTION get_work_queue()
RETURNS TABLE(
  id UUID,
  title TEXT,
  priority TEXT,
  status TEXT,
  progress_percentage INTEGER,
  blocked BOOLEAN,
  estimated_effort_hours INTEGER,
  time_spent_minutes INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    w.id,
    w.title,
    w.priority,
    w.status,
    w.progress_percentage,
    (w.status = 'blocked') as blocked,
    w.estimated_effort_hours,
    w.time_spent_minutes
  FROM work_items w
  WHERE w.status != 'completed'
  ORDER BY
    -- Blocked items go to bottom
    CASE WHEN w.status = 'blocked' THEN 1 ELSE 0 END,
    -- Then by priority
    CASE w.priority
      WHEN 'critical' THEN 1
      WHEN 'high' THEN 2
      WHEN 'medium' THEN 3
      WHEN 'low' THEN 4
    END,
    -- Then by in-progress first (to finish what's started)
    CASE WHEN w.status IN ('implementing', 'testing', 'reviewing') THEN 0 ELSE 1 END,
    -- Finally by created date
    w.created_at ASC;
END;
$$ LANGUAGE plpgsql;

-- Get work item with full context
CREATE OR REPLACE FUNCTION get_work_item_full(item_id UUID)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'work_item', row_to_json(w.*),
    'recent_sessions', (
      SELECT COALESCE(json_agg(s.*), '[]'::json)
      FROM (
        SELECT * FROM work_sessions
        WHERE work_item_id = item_id
        ORDER BY started_at DESC
        LIMIT 5
      ) s
    ),
    'conversation', (
      SELECT COALESCE(json_agg(m.*), '[]'::json)
      FROM (
        SELECT m.* FROM conversation_messages m
        JOIN conversation_threads t ON t.id = m.thread_id
        WHERE t.work_item_id = item_id
        ORDER BY m.created_at ASC
        LIMIT 50
      ) m
    ),
    'recent_activity', (
      SELECT COALESCE(json_agg(a.*), '[]'::json)
      FROM (
        SELECT * FROM agent_activity_log
        WHERE work_item_id = item_id
        ORDER BY created_at DESC
        LIMIT 10
      ) a
    )
  ) INTO result
  FROM work_items w
  WHERE w.id = item_id;

  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Generate daily standup
CREATE OR REPLACE FUNCTION generate_daily_standup(target_date DATE DEFAULT CURRENT_DATE)
RETURNS JSON AS $$
DECLARE
  standup JSON;
  completed UUID[];
  in_progress UUID[];
  blocked UUID[];
  highlights_list TEXT[];
  challenges_list TEXT[];
BEGIN
  -- Get work items by status
  SELECT array_agg(id) INTO completed
  FROM work_items
  WHERE DATE(completed_at) = target_date;

  SELECT array_agg(id) INTO in_progress
  FROM work_items
  WHERE status IN ('analyzing', 'planning', 'implementing', 'testing', 'reviewing')
    AND (started_at IS NULL OR DATE(started_at) <= target_date);

  SELECT array_agg(id) INTO blocked
  FROM work_items
  WHERE status = 'blocked';

  -- Generate highlights
  SELECT array_agg(format('Completed: %s', title))
  INTO highlights_list
  FROM work_items
  WHERE id = ANY(completed);

  -- Generate challenges
  SELECT array_agg(format('Blocked: %s - %s', title, blocked_reason))
  INTO challenges_list
  FROM work_items
  WHERE status = 'blocked';

  -- Build standup JSON
  standup := json_build_object(
    'date', target_date,
    'completed_count', COALESCE(array_length(completed, 1), 0),
    'in_progress_count', COALESCE(array_length(in_progress, 1), 0),
    'blocked_count', COALESCE(array_length(blocked, 1), 0),
    'completed_items', COALESCE(completed, ARRAY[]::UUID[]),
    'in_progress_items', COALESCE(in_progress, ARRAY[]::UUID[]),
    'blocked_items', COALESCE(blocked, ARRAY[]::UUID[]),
    'highlights', COALESCE(highlights_list, ARRAY[]::TEXT[]),
    'challenges', COALESCE(challenges_list, ARRAY[]::TEXT[])
  );

  -- Insert into daily_standups table
  INSERT INTO daily_standups (
    date,
    completed_count,
    in_progress_count,
    blocked_count,
    completed_items,
    in_progress_items,
    blocked_items,
    highlights,
    challenges
  )
  VALUES (
    target_date,
    COALESCE(array_length(completed, 1), 0),
    COALESCE(array_length(in_progress, 1), 0),
    COALESCE(array_length(blocked, 1), 0),
    COALESCE(completed, ARRAY[]::UUID[]),
    COALESCE(in_progress, ARRAY[]::UUID[]),
    COALESCE(blocked, ARRAY[]::UUID[]),
    COALESCE(highlights_list, ARRAY[]::TEXT[]),
    COALESCE(challenges_list, ARRAY[]::TEXT[])
  )
  ON CONFLICT (date) DO UPDATE SET
    completed_count = EXCLUDED.completed_count,
    in_progress_count = EXCLUDED.in_progress_count,
    blocked_count = EXCLUDED.blocked_count,
    completed_items = EXCLUDED.completed_items,
    in_progress_items = EXCLUDED.in_progress_items,
    blocked_items = EXCLUDED.blocked_items,
    highlights = EXCLUDED.highlights,
    challenges = EXCLUDED.challenges;

  RETURN standup;
END;
$$ LANGUAGE plpgsql;

-- Get stats for dashboard
CREATE OR REPLACE FUNCTION get_agent_stats()
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'total_items', COUNT(*),
    'by_status', (
      SELECT json_object_agg(status, count)
      FROM (
        SELECT status, COUNT(*) as count
        FROM work_items
        GROUP BY status
      ) s
    ),
    'by_priority', (
      SELECT json_object_agg(priority, count)
      FROM (
        SELECT priority, COUNT(*) as count
        FROM work_items
        WHERE status != 'completed'
        GROUP BY priority
      ) p
    ),
    'completion_rate', (
      SELECT ROUND(
        (COUNT(*) FILTER (WHERE status = 'completed'))::numeric /
        NULLIF(COUNT(*), 0) * 100,
        2
      )
      FROM work_items
    ),
    'avg_time_to_complete', (
      SELECT ROUND(AVG(EXTRACT(EPOCH FROM (completed_at - started_at)) / 3600), 2)
      FROM work_items
      WHERE completed_at IS NOT NULL AND started_at IS NOT NULL
    ),
    'blocked_items', (
      SELECT COUNT(*)
      FROM work_items
      WHERE status = 'blocked'
    )
  ) INTO result
  FROM work_items;

  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON TABLE work_items IS 'Tracks all development work items with persistent context and completion criteria';
COMMENT ON TABLE work_sessions IS 'Logs each work session with actions taken and progress made';
COMMENT ON TABLE conversation_threads IS 'Chat conversation threads linked to work items';
COMMENT ON TABLE conversation_messages IS 'Individual messages in chat conversations';
COMMENT ON TABLE daily_standups IS 'Autonomous daily progress reports generated by the agent';
COMMENT ON TABLE agent_activity_log IS 'Detailed activity log for debugging and monitoring agent behavior';

-- =====================================================
-- INITIAL DATA (Example work item)
-- =====================================================

-- Insert an example work item to demonstrate structure
INSERT INTO work_items (
  title,
  description,
  type,
  priority,
  status,
  completion_criteria,
  implementation_plan,
  context,
  tags
) VALUES (
  'Setup Raven Agent System',
  'Complete the initial setup of the Raven Agent persistent development assistant system including database, API routes, UI, and MCP server.',
  'feature',
  'critical',
  'in_progress',
  '[
    {"criterion": "Database migration deployed", "completed": true, "completed_at": null},
    {"criterion": "API routes implemented", "completed": false, "completed_at": null},
    {"criterion": "UI components created", "completed": false, "completed_at": null},
    {"criterion": "MCP server configured", "completed": false, "completed_at": null},
    {"criterion": "System tested end-to-end", "completed": false, "completed_at": null}
  ]'::jsonb,
  '{
    "steps": [
      {"step": 1, "description": "Run database migration", "status": "completed"},
      {"step": 2, "description": "Create API routes", "status": "in_progress"},
      {"step": 3, "description": "Build UI components", "status": "pending"},
      {"step": 4, "description": "Setup MCP server", "status": "pending"},
      {"step": 5, "description": "End-to-end testing", "status": "pending"}
    ]
  }'::jsonb,
  '{
    "files_involved": [
      "supabase/migrations/20250115_raven_agent.sql",
      "app/api/agent/",
      "app/(admin)/admin/agent/page.tsx",
      "mcp-servers/raven-agent/"
    ],
    "key_decisions": [
      "Using JSONB for flexible completion criteria",
      "Separate tables for sessions vs conversations",
      "Autonomous daily standups"
    ]
  }'::jsonb,
  ARRAY['raven-agent', 'setup', 'infrastructure']
);
```

---

*[Sections 4-9 containing API Routes, UI Components, MCP Server, Autonomous Agent, Deployment, and Usage Examples omitted for length - available in original file]*

---

**End of Specification**

Last updated: January 15, 2025

