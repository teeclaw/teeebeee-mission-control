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
