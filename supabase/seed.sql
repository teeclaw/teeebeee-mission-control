insert into opportunities (id, title, stage, confidence, owner)
values
  ('opp-001', 'Agent Reputation SDK', 'validation', 78, 'Miyabi'),
  ('opp-002', 'Base Creator Intelligence', 'thesis', 64, 'Sora'),
  ('opp-003', 'A2A Job Router', 'build', 82, 'Nagare')
on conflict (id) do update set
  title = excluded.title,
  stage = excluded.stage,
  confidence = excluded.confidence,
  owner = excluded.owner;

insert into validations (opportunity_id, decision, rationale, decided_at)
values
  ('opp-001', 'CONDITIONAL_GO', 'Strong demand, needs faster GTM proof', now())
on conflict do nothing;

insert into portfolio_slots (slot_id, project, status, sunset_at)
values
  ('slot-1', 'zkBasecred', 'active', '2026-03-30'),
  ('slot-2', 'Agent Royale', 'active', '2026-04-10')
on conflict (slot_id) do update set
  project = excluded.project,
  status = excluded.status,
  sunset_at = excluded.sunset_at;

insert into agent_runs (agent_id, name, health, last_run_at)
values
  ('pipeline-controller', 'Taiga', 'healthy', now()),
  ('market-researcher', 'Sora', 'stalled', now() - interval '190 minutes'),
  ('lead-developer', 'Nagare', 'healthy', now())
on conflict (agent_id) do update set
  name = excluded.name,
  health = excluded.health,
  last_run_at = excluded.last_run_at;

insert into reports (id, summary, created_at)
values
  ('rpt-001', '1 thesis advanced to validation, 0 launches, 1 slot risk flagged.', now())
on conflict (id) do update set
  summary = excluded.summary,
  created_at = excluded.created_at;

insert into cron_jobs (id, title, owner, schedule, day, status)
values
  ('cron-1', 'Daily Morning Brief', 'Taiga', '03:00 UTC+7', 'Mon', 'healthy'),
  ('cron-2', 'Daily Improvement Surprise', 'Shizuku', '04:00 UTC+7', 'Tue', 'healthy'),
  ('cron-3', 'Security Audit', 'Kurogane', '09:00 UTC+7', 'Wed', 'delayed'),
  ('cron-4', 'Portfolio Governance', 'Mizuho', '10:00 UTC+7', 'Thu', 'healthy'),
  ('cron-5', 'Weekly GTM Pulse', 'Himawari', '17:00 UTC+7', 'Fri', 'healthy')
on conflict (id) do update set
  title = excluded.title,
  owner = excluded.owner,
  schedule = excluded.schedule,
  day = excluded.day,
  status = excluded.status;

insert into todos (id, title, status, priority, created_at)
values
  ('todo-1', 'Wire OpenClaw session telemetry', 'pending', 'high', now()),
  ('todo-2', 'Add RLS policies', 'pending', 'medium', now()),
  ('todo-3', 'Finalize analytics widgets', 'done', 'low', now())
on conflict (id) do update set
  title = excluded.title,
  status = excluded.status,
  priority = excluded.priority,
  created_at = excluded.created_at;
