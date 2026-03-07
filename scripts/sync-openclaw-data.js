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
    const agents = Object.entries(config.agents || {}).map(([agentId, agentConfig]) => {
      if (agentId === 'defaults') return null;
      
      return {
        agent_id: agentId,
        name: agentNames[agentId] || agentId,
        health: 'healthy', // Default - could be enhanced with real health checks
        last_run_at: new Date().toISOString(),
        synced_at: new Date().toISOString()
      };
    }).filter(Boolean);
    
    if (agents.length > 0) {
      // Upsert agents
      const { error } = await supabase
        .from('agent_runs')
        .upsert(agents, { onConflict: 'agent_id' });
      
      if (error) {
        console.error('❌ Error syncing agents:', error.message);
        return false;
      }
      
      console.log(`✅ Synced ${agents.length} agents to Supabase`);
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