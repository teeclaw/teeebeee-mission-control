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
