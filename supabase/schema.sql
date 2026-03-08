create table if not exists opportunities (
  id text primary key,
  title text not null,
  stage text not null check (stage in ('signal','thesis','validation','build','launch')),
  confidence int not null check (confidence >= 0 and confidence <= 100),
  owner text not null,
  created_at timestamptz not null default now()
);

create table if not exists validations (
  opportunity_id text not null references opportunities(id) on delete cascade,
  decision text not null check (decision in ('GO','NO_GO','CONDITIONAL_GO')),
  rationale text not null,
  decided_at timestamptz not null default now()
);

create table if not exists portfolio_slots (
  slot_id text primary key,
  project text not null,
  status text not null check (status in ('active','sunset')),
  sunset_at text not null
);

create table if not exists agent_runs (
  agent_id text primary key,
  name text not null,
  health text not null check (health in ('healthy','stalled','offline')),
  last_run_at timestamptz not null default now()
);

create table if not exists reports (
  id text primary key,
  summary text not null,
  created_at timestamptz not null default now()
);

create table if not exists kill_logs (
  id text primary key,
  slot_id text not null references portfolio_slots(slot_id),
  reason text not null,
  killed_by text not null,
  killed_at timestamptz not null default now()
);

create table if not exists cron_jobs (
  id text primary key,
  title text not null,
  owner text not null,
  schedule text not null,
  day text not null check (day in ('Sun','Mon','Tue','Wed','Thu','Fri','Sat','All')),
  frequency text not null default 'weekly' check (frequency in ('always','daily','weekly')),
  status text not null check (status in ('healthy','delayed','failed')),
  color text not null default '#6366f1'
);

create table if not exists todos (
  id text primary key,
  title text not null,
  status text not null check (status in ('pending','done')),
  priority text not null check (priority in ('low','medium','high')),
  created_at timestamptz not null default now()
);

create table if not exists revenue_ready_events (
  id text primary key,
  opportunity_id text not null references opportunities(id) on delete cascade,
  project_name text not null,
  recorded_at timestamptz not null default now()
);

create table if not exists opportunity_reports (
  opportunity_id text primary key references opportunities(id) on delete cascade,
  signal_summary text not null,
  signal_evidence text not null,
  thesis_summary text not null,
  thesis_model text not null,
  validation_decision text check (validation_decision in ('GO','NO_GO','CONDITIONAL_GO')),
  validation_summary text not null,
  key_risks text not null,
  sources text not null,
  updated_at timestamptz not null default now()
);

create table if not exists agent_events_raw (
  id uuid primary key,
  event_id text unique not null,
  event_type text not null,
  agent_id text not null,
  payload jsonb not null,
  sent_at timestamptz not null,
  received_at timestamptz not null default now()
);

create table if not exists webhook_receipts (
  event_id text primary key,
  source text not null,
  received_at timestamptz not null default now()
);

create table if not exists org_nodes (
  agent_id text primary key,
  name text not null,
  role text not null,
  team text not null,
  manager_id text null,
  level int not null default 3,
  status text not null check (status in ('idle','running','blocked','error','offline')),
  health_score int not null default 50,
  last_event_at timestamptz,
  freshness_sec int,
  model_primary text,
  model_fallback text,
  updated_at timestamptz not null default now()
);

create table if not exists org_edges (
  id text primary key,
  from_agent_id text not null references org_nodes(agent_id) on delete cascade,
  to_agent_id text not null references org_nodes(agent_id) on delete cascade,
  relation_type text not null check (relation_type in ('solid','dotted'))
);

create table if not exists agent_blockers (
  id text primary key,
  agent_id text not null references org_nodes(agent_id) on delete cascade,
  severity text not null check (severity in ('low','medium','high','critical')),
  title text not null,
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);

create table if not exists agent_task_current (
  agent_id text primary key references org_nodes(agent_id) on delete cascade,
  title text not null,
  project text,
  pipeline_stage text,
  started_at timestamptz
);

create table if not exists agent_metrics_7d (
  agent_id text primary key references org_nodes(agent_id) on delete cascade,
  throughput int not null default 0,
  error_rate numeric(5,2) not null default 0,
  retries int not null default 0
);
