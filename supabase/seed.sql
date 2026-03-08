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
  ('main', 'Mizutama', 'healthy', now()),
  ('pipeline-controller', 'Taiga', 'healthy', now()),
  ('market-researcher', 'Sora', 'stalled', now() - interval '190 minutes'),
  ('opportunity-validator', 'Miyabi', 'healthy', now() - interval '45 minutes'),
  ('portfolio-manager', 'Mizuho', 'healthy', now() - interval '30 minutes'),
  ('product-architect', 'Kagayaki', 'offline', now() - interval '8 hours'),
  ('lead-developer', 'Nagare', 'healthy', now()),
  ('head-of-growth', 'Himawari', 'healthy', now() - interval '60 minutes'),
  ('data-analyst', 'Shizuku', 'healthy', now() - interval '120 minutes'),
  ('security-engineer', 'Kurogane', 'healthy', now() - interval '90 minutes'),
  ('qa-auditor', 'Komari', 'offline', now() - interval '12 hours')
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

insert into cron_jobs (id, title, owner, schedule, day, frequency, status, color)
values
  ('cron-0', 'Mission Control Check', 'Taiga', 'Every 30 min', 'All', 'always', 'healthy', '#6366f1'),
  ('cron-1', 'Market Signal Scan', 'Sora', '5:00 AM', 'All', 'daily', 'healthy', '#eab308'),
  ('cron-2', 'Morning Brief', 'Taiga', '8:00 AM', 'All', 'daily', 'healthy', '#22c55e'),
  ('cron-3', 'Competitor YouTube Scan', 'Sora', '10:00 AM', 'All', 'daily', 'healthy', '#ef4444'),
  ('cron-4', 'Newsletter Reminder', 'Himawari', '9:00 AM', 'Tue', 'weekly', 'healthy', '#a855f7'),
  ('cron-5', 'Security Audit', 'Kurogane', '9:00 AM', 'Wed', 'weekly', 'delayed', '#f97316'),
  ('cron-6', 'Portfolio Governance', 'Mizuho', '10:00 AM', 'Thu', 'weekly', 'healthy', '#06b6d4'),
  ('cron-7', 'Weekly GTM Pulse', 'Himawari', '5:00 PM', 'Fri', 'weekly', 'healthy', '#ec4899'),
  ('cron-8', 'Data Cleanup', 'Shizuku', '2:00 AM', 'Sat', 'weekly', 'healthy', '#14b8a6')
on conflict (id) do update set
  title = excluded.title,
  owner = excluded.owner,
  schedule = excluded.schedule,
  day = excluded.day,
  frequency = excluded.frequency,
  status = excluded.status,
  color = excluded.color;

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

insert into revenue_ready_events (id, opportunity_id, project_name, recorded_at)
values
  ('rev-1', 'opp-001', 'Agent Reputation SDK', now() - interval '5 days'),
  ('rev-2', 'opp-003', 'A2A Job Router', now() - interval '17 days')
on conflict (id) do update set
  opportunity_id = excluded.opportunity_id,
  project_name = excluded.project_name,
  recorded_at = excluded.recorded_at;

insert into opportunity_reports (
  opportunity_id,
  signal_summary,
  signal_evidence,
  thesis_summary,
  thesis_model,
  validation_decision,
  validation_summary,
  key_risks,
  sources,
  updated_at
)
values
  (
    'opp-001',
    'Rising demand for onchain verifiable agent trust and reputation primitives.',
    'Repeated mentions across builder communities + increasing protocol requests for trust scoring integrations.',
    'Ship an SDK that lets apps attach and verify agent reputation attestations with low integration overhead.',
    'Developer-first B2B SDK with API + dashboard + attestations index.',
    'CONDITIONAL_GO',
    'Validation is positive but GTM proof still needed from 2+ production integrations.',
    'Slow adoption if attestations remain fragmented; platform dependency risk.',
    'Internal signal board, community scans, project validation notes.',
    now()
  ),
  (
    'opp-002',
    'Base creator analytics demand is growing among NFT/agent-native projects.',
    'Founders request better insight tooling for launch timing, wallet cohorts, and retention funnels.',
    'Create creator intelligence suite focused on Base-native launches and post-mint analytics.',
    'Subscription intelligence product with cohort analytics + launch recommendation layer.',
    null,
    'Not validated yet; currently in thesis stage.',
    'Competing analytics tools can compress margins quickly.',
    'Internal discovery logs and opportunity-thesis artifacts.',
    now()
  ),
  (
    'opp-003',
    'Teams need deterministic routing and orchestration for multi-agent workflows.',
    'Operational pain observed in manual routing across specialized agents and brittle handoffs.',
    'Build A2A router that standardizes dispatch, retries, and execution accountability.',
    'Workflow infrastructure product with policy engine + observability layer.',
    'GO',
    'Validation supports immediate build execution.',
    'Requires robust reliability guarantees to avoid churn.',
    'Pipeline run logs and validation summaries.',
    now()
  )
on conflict (opportunity_id) do update set
  signal_summary = excluded.signal_summary,
  signal_evidence = excluded.signal_evidence,
  thesis_summary = excluded.thesis_summary,
  thesis_model = excluded.thesis_model,
  validation_decision = excluded.validation_decision,
  validation_summary = excluded.validation_summary,
  key_risks = excluded.key_risks,
  sources = excluded.sources,
  updated_at = excluded.updated_at;
