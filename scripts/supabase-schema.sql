-- Mission Control Dashboard - Supabase Schema
-- Creates tables for syncing OpenClaw data

-- Cron Jobs table
CREATE TABLE IF NOT EXISTS cron_jobs (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  owner TEXT NOT NULL,
  schedule TEXT NOT NULL,
  day TEXT NOT NULL,
  frequency TEXT NOT NULL CHECK (frequency IN ('always', 'daily', 'weekly')),
  status TEXT NOT NULL CHECK (status IN ('healthy', 'delayed', 'failed')),
  color TEXT NOT NULL,
  synced_at TIMESTAMPTZ DEFAULT NOW()
);

-- Agent Runs table 
CREATE TABLE IF NOT EXISTS agent_runs (
  agent_id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  health TEXT NOT NULL CHECK (health IN ('healthy', 'stalled', 'offline')),
  last_run_at TIMESTAMPTZ,
  synced_at TIMESTAMPTZ DEFAULT NOW()
);

-- Opportunities table (existing or new)
CREATE TABLE IF NOT EXISTS opportunities (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  stage TEXT NOT NULL CHECK (stage IN ('signal', 'thesis', 'validation', 'build', 'launch')),
  confidence INTEGER CHECK (confidence >= 0 AND confidence <= 100),
  owner TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Validations table (existing or new)
CREATE TABLE IF NOT EXISTS validations (
  id SERIAL PRIMARY KEY,
  opportunity_id TEXT REFERENCES opportunities(id) ON DELETE CASCADE,
  decision TEXT NOT NULL CHECK (decision IN ('GO', 'NO_GO', 'CONDITIONAL_GO')),
  rationale TEXT,
  decided_at TIMESTAMPTZ DEFAULT NOW()
);

-- Portfolio Slots table (existing or new)
CREATE TABLE IF NOT EXISTS portfolio_slots (
  slot_id TEXT PRIMARY KEY,
  project TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('active', 'sunset')),
  sunset_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Kill Logs table (existing or new)
CREATE TABLE IF NOT EXISTS kill_logs (
  id TEXT PRIMARY KEY,
  slot_id TEXT NOT NULL,
  reason TEXT NOT NULL,
  killed_by TEXT NOT NULL,
  killed_at TIMESTAMPTZ DEFAULT NOW()
);

-- Reports table (existing or new)
CREATE TABLE IF NOT EXISTS reports (
  id TEXT PRIMARY KEY,
  summary TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Revenue Ready Events table (existing or new)
CREATE TABLE IF NOT EXISTS revenue_ready_events (
  id TEXT PRIMARY KEY,
  opportunity_id TEXT REFERENCES opportunities(id) ON DELETE CASCADE,
  project_name TEXT NOT NULL,
  recorded_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS agent_events_raw (
  id UUID PRIMARY KEY,
  event_id TEXT UNIQUE NOT NULL,
  event_type TEXT NOT NULL,
  agent_id TEXT NOT NULL,
  payload JSONB NOT NULL,
  sent_at TIMESTAMPTZ NOT NULL,
  received_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS webhook_receipts (
  event_id TEXT PRIMARY KEY,
  source TEXT NOT NULL,
  received_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS org_nodes (
  agent_id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  team TEXT NOT NULL,
  manager_id TEXT NULL,
  level INT NOT NULL DEFAULT 3,
  status TEXT NOT NULL CHECK (status IN ('idle','running','blocked','error','offline')),
  health_score INT NOT NULL DEFAULT 50,
  last_event_at TIMESTAMPTZ,
  freshness_sec INT,
  model_primary TEXT,
  model_fallback TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS org_edges (
  id TEXT PRIMARY KEY,
  from_agent_id TEXT NOT NULL REFERENCES org_nodes(agent_id) ON DELETE CASCADE,
  to_agent_id TEXT NOT NULL REFERENCES org_nodes(agent_id) ON DELETE CASCADE,
  relation_type TEXT NOT NULL CHECK (relation_type IN ('solid','dotted'))
);

CREATE TABLE IF NOT EXISTS agent_blockers (
  id TEXT PRIMARY KEY,
  agent_id TEXT NOT NULL REFERENCES org_nodes(agent_id) ON DELETE CASCADE,
  severity TEXT NOT NULL CHECK (severity IN ('low','medium','high','critical')),
  title TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS agent_task_current (
  agent_id TEXT PRIMARY KEY REFERENCES org_nodes(agent_id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  project TEXT,
  pipeline_stage TEXT,
  started_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS agent_metrics_7d (
  agent_id TEXT PRIMARY KEY REFERENCES org_nodes(agent_id) ON DELETE CASCADE,
  throughput INT NOT NULL DEFAULT 0,
  error_rate NUMERIC(5,2) NOT NULL DEFAULT 0,
  retries INT NOT NULL DEFAULT 0
);

-- Enable Row Level Security (RLS) - Optional
-- ALTER TABLE cron_jobs ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE agent_runs ENABLE ROW LEVEL SECURITY;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_cron_jobs_frequency ON cron_jobs(frequency);
CREATE INDEX IF NOT EXISTS idx_cron_jobs_status ON cron_jobs(status);
CREATE INDEX IF NOT EXISTS idx_agent_runs_health ON agent_runs(health);
CREATE INDEX IF NOT EXISTS idx_opportunities_stage ON opportunities(stage);
CREATE INDEX IF NOT EXISTS idx_validations_decision ON validations(decision);
CREATE INDEX IF NOT EXISTS idx_portfolio_slots_status ON portfolio_slots(status);

-- Grant permissions to service role (replace 'service_role' with your actual role name if different)
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
