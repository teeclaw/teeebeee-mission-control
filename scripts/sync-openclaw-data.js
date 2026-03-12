#!/usr/bin/env node

/**
 * OpenClaw → Supabase Sync Script
 * Reads local OpenClaw data and syncs to Supabase for Mission Control dashboard
 */

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Configuration
const HOME_DIR = process.env.HOME || '/home/phan_harry';
const OPENCLAW_DIR = path.join(HOME_DIR, '.openclaw');

// Load credentials from ~/.openclaw/.env if not already in environment
const envPath = path.join(OPENCLAW_DIR, '.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const val = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, '');
    if (!process.env[key]) process.env[key] = val;
  }
}

// Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false, autoRefreshToken: false }
});

// Status colors for different job types
const jobColors = [
  "#6366f1", "#eab308", "#22c55e", "#ef4444", "#a855f7", 
  "#f97316", "#06b6d4", "#ec4899", "#14b8a6", "#8b5cf6"
];

const agentNames = {
  'main': 'Main Agent',
  'pipeline-controller': 'Pipeline Controller',
  'market-signal-scan': 'Market Signal Scanner', 
  'portfolio-manager': 'Portfolio Manager',
  'opportunity-validate': 'Opportunity Validator',
  'business-design': 'Business Designer',
  'business-build': 'Business Builder',
  'business-launch': 'Business Launcher'
};

function getAgentRuntimeSnapshot(agentId) {
  try {
    const sessionsPath = path.join(OPENCLAW_DIR, 'agents', agentId, 'sessions', 'sessions.json');
    if (!fs.existsSync(sessionsPath)) {
      return { status: 'offline', lastRunAt: null };
    }

    const payload = JSON.parse(fs.readFileSync(sessionsPath, 'utf-8'));
    const rows = Object.values(payload || {});
    if (!rows.length) {
      return { status: 'offline', lastRunAt: null };
    }

    const latest = rows.reduce((acc, cur) => {
      const a = Number(acc?.updatedAt || 0);
      const b = Number(cur?.updatedAt || 0);
      return b > a ? cur : acc;
    }, rows[0]);

    const updatedAtMs = Number(latest?.updatedAt || 0);
    const ageSec = updatedAtMs ? Math.floor((Date.now() - updatedAtMs) / 1000) : Infinity;
    const aborted = Boolean(latest?.abortedLastRun);

    let status = 'offline';
    if (aborted) status = 'error';
    else if (ageSec <= 300) status = 'running';
    else if (ageSec <= 86400) status = 'idle';
    else status = 'offline';

    return {
      status,
      lastRunAt: updatedAtMs ? new Date(updatedAtMs).toISOString() : null
    };
  } catch (error) {
    return { status: 'offline', lastRunAt: null };
  }
}

function parseCronExpression(expr) {
  const parts = expr.split(" ");
  if (parts.length !== 5) return { schedule: expr, day: "All", frequency: "daily" };
  
  const [min, hour, dayOfMonth, month, dayOfWeek] = parts;
  
  // Handle frequency patterns
  if (dayOfMonth.includes("*/")) {
    const interval = parseInt(dayOfMonth.substring(2));
    return {
      schedule: `${hour}:${min.padStart(2, '0')}`,
      day: "All",
      frequency: interval === 1 ? "daily" : "weekly"
    };
  }
  
  // Handle weekly patterns  
  if (dayOfWeek !== "*") {
    const dayMap = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const dayIndex = parseInt(dayOfWeek);
    return {
      schedule: `${hour}:${min.padStart(2, '0')}`,
      day: dayMap[dayIndex] || "All",
      frequency: "weekly"
    };
  }
  
  // Daily pattern
  return {
    schedule: `${hour}:${min.padStart(2, '0')}`,
    day: "All", 
    frequency: "daily"
  };
}

async function readOpenClawCronJobs() {
  try {
    const cronPath = path.join(OPENCLAW_DIR, 'cron/jobs.json');
    
    if (!fs.existsSync(cronPath)) {
      console.log(`⚠️  OpenClaw cron file not found: ${cronPath}`);
      return [];
    }
    
    const content = fs.readFileSync(cronPath, 'utf-8');
    const data = JSON.parse(content);
    
    const jobs = data.jobs
      .filter(job => job.enabled)
      .map((job, index) => {
        let scheduleStr, day, frequency;
        
        if (job.schedule.kind === "cron") {
          const parsed = parseCronExpression(job.schedule.expr || "");
          scheduleStr = parsed.schedule;
          day = parsed.day;
          frequency = parsed.frequency;
        } else if (job.schedule.kind === "every") {
          const hours = Math.round(job.schedule.everyMs / 1000 / 3600);
          scheduleStr = `Every ${hours}h`;
          day = "All";
          frequency = hours === 24 ? "daily" : "always";
        } else {
          scheduleStr = "Unknown";
          day = "All";
          frequency = "daily";
        }
        
        const owner = agentNames[job.agentId] || job.agentId;
        const status = job.state?.lastRunStatus === "error" ? "failed" : 
                     job.state?.consecutiveErrors > 0 ? "delayed" : "healthy";
        
        return {
          id: job.id,
          title: job.name,
          owner,
          schedule: scheduleStr,
          day,
          frequency,
          status,
          color: jobColors[index % jobColors.length],
          synced_at: new Date().toISOString()
        };
      });
    
    console.log(`📊 Found ${jobs.length} enabled OpenClaw cron jobs`);
    return jobs;
  } catch (error) {
    console.error('❌ Error reading OpenClaw cron jobs:', error.message);
    return [];
  }
}

async function syncCronJobs(jobs) {
  try {
    // Delete existing records
    const { error: deleteError } = await supabase
      .from('cron_jobs')
      .delete()
      .neq('id', 'impossible-value'); // Delete all records
    
    if (deleteError && !deleteError.message.includes('No rows found')) {
      console.log('⚠️  Note: Error clearing existing cron jobs:', deleteError.message);
    }
    
    // Insert new records
    if (jobs.length > 0) {
      const { data, error } = await supabase
        .from('cron_jobs')
        .insert(jobs)
        .select();
      
      if (error) {
        console.error('❌ Error syncing cron jobs to Supabase:', error);
        return false;
      }
      
      console.log(`✅ Synced ${data?.length || jobs.length} cron jobs to Supabase`);
    } else {
      console.log(`🔄 No cron jobs to sync`);
    }
    
    return true;
  } catch (error) {
    console.error('❌ Error in syncCronJobs:', error.message);
    return false;
  }
}

async function syncAgentRuns() {
  try {
    // Read OpenClaw config to get agent status
    const configPath = path.join(OPENCLAW_DIR, 'openclaw.json');
    if (!fs.existsSync(configPath)) {
      console.log(`⚠️  OpenClaw config not found: ${configPath}`);
      return false;
    }
    
    const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    const list = Array.isArray(config?.agents?.list) ? config.agents.list : [];
    const defaultPrimary = config?.agents?.defaults?.model?.primary || null;
    const defaultFallback = config?.agents?.defaults?.model?.fallback || null;

    const agents = list
      .map((a) => {
        const agentId = a?.id;
        if (!agentId) return null;
        const runtime = getAgentRuntimeSnapshot(agentId);
        const now = new Date().toISOString();

        return {
          agent_id: agentId,
          name: a?.name || agentNames[agentId] || agentId,
          model_primary: a?.model?.primary || defaultPrimary,
          model_fallback: a?.model?.fallback || defaultFallback,
          runtime_status: runtime.status,
          health: runtime.status === 'running' ? 'healthy' : runtime.status === 'idle' ? 'stalled' : 'offline',
          last_run_at: runtime.lastRunAt || now,
          has_runtime_timestamp: Boolean(runtime.lastRunAt),
          synced_at: now
        };
      })
      .filter(Boolean);
    
    if (agents.length > 0) {
      // Cleanup wrong legacy row caused by previous parser bug
      await supabase.from('agent_runs').delete().eq('agent_id', 'list');
      await supabase.from('org_nodes').delete().eq('agent_id', 'list');

      // Upsert agents
      const { error } = await supabase
        .from('agent_runs')
        .upsert(agents.map(a => ({
          agent_id: a.agent_id,
          name: a.name,
          health: a.health,
          last_run_at: a.last_run_at,
          synced_at: a.synced_at
        })), { onConflict: 'agent_id' });
      
      if (error) {
        console.error('❌ Error syncing agents:', error.message);
        return false;
      }
      
      console.log(`✅ Synced ${agents.length} agents to Supabase`);

      const roleMap = {
        'main': { role: 'CEO', team: 'Leadership', level: 0, manager_id: null },
        'pipeline-controller': { role: 'COO', team: 'Leadership', level: 1, manager_id: 'main' },
        'portfolio-manager': { role: 'Portfolio', team: 'Operations', level: 2, manager_id: 'pipeline-controller' },
        'market-researcher': { role: 'Research', team: 'Discovery', level: 2, manager_id: 'pipeline-controller' },
        'opportunity-validator': { role: 'Validator', team: 'Discovery', level: 2, manager_id: 'pipeline-controller' },
        'product-architect': { role: 'Architect', team: 'Build', level: 2, manager_id: 'pipeline-controller' },
        'lead-developer': { role: 'Developer', team: 'Build', level: 3, manager_id: 'product-architect' },
        'security-engineer': { role: 'Security', team: 'Build', level: 3, manager_id: 'product-architect' },
        'qa-auditor': { role: 'QA', team: 'Build', level: 3, manager_id: 'product-architect' },
        'head-of-growth': { role: 'Growth', team: 'Launch', level: 2, manager_id: 'pipeline-controller' },
        'data-analyst': { role: 'Data', team: 'Launch', level: 3, manager_id: 'head-of-growth' }
      };

      const orgNodes = agents.map((a) => ({
        agent_id: a.agent_id,
        name: a.name,
        role: roleMap[a.agent_id]?.role || 'AGENT',
        team: roleMap[a.agent_id]?.team || 'Unassigned',
        manager_id: roleMap[a.agent_id]?.manager_id || null,
        level: roleMap[a.agent_id]?.level ?? 3,
        status: 'idle',
        health_score: a.runtime_status === 'running' ? 95 : a.runtime_status === 'idle' ? 70 : a.runtime_status === 'error' ? 30 : 20,
        last_event_at: a.last_run_at,
        freshness_sec: a.has_runtime_timestamp
          ? Math.max(0, Math.floor((Date.now() - new Date(a.last_run_at).getTime()) / 1000))
          : null,
        model_primary: a.model_primary || null,
        model_fallback: a.model_fallback || null,
        status: a.runtime_status,
        updated_at: new Date().toISOString()
      }));

      const { error: orgErr } = await supabase
        .from('org_nodes')
        .upsert(orgNodes, { onConflict: 'agent_id' });

      if (orgErr) {
        console.error('❌ Error syncing org nodes:', orgErr.message);
        return false;
      }

      const edges = orgNodes
        .filter((n) => n.manager_id)
        .map((n) => ({
          id: `${n.manager_id}->${n.agent_id}`,
          from_agent_id: n.manager_id,
          to_agent_id: n.agent_id,
          relation_type: 'solid'
        }));

      await supabase.from('org_edges').delete().neq('id', '__never__');
      if (edges.length > 0) {
        const { error: edgeErr } = await supabase
          .from('org_edges')
          .upsert(edges, { onConflict: 'id' });
        if (edgeErr) {
          console.error('❌ Error syncing org edges:', edgeErr.message);
          return false;
        }
      }

      console.log(`✅ Synced ${orgNodes.length} org nodes to Supabase`);
      console.log(`✅ Synced ${edges.length} org edges to Supabase`);
    }
    
    return true;
  } catch (error) {
    console.error('❌ Error in syncAgentRuns:', error.message);
    return false;
  }
}

async function main() {
  console.log('🔄 Starting OpenClaw → Supabase sync...');
  console.log(`📂 OpenClaw directory: ${OPENCLAW_DIR}`);
  
  try {
    // Sync cron jobs
    const cronJobs = await readOpenClawCronJobs();
    const cronSuccess = await syncCronJobs(cronJobs);
    
    // Sync agent status
    const agentSuccess = await syncAgentRuns();
    
    if (cronSuccess && agentSuccess) {
      console.log('🎉 Sync completed successfully');
      process.exit(0);
    } else {
      console.log('⚠️  Sync completed with some errors');
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Sync failed:', error.message);
    process.exit(1);
  }
}

// Only run if called directly
if (require.main === module) {
  main();
}

module.exports = { main, readOpenClawCronJobs, syncCronJobs, syncAgentRuns };
