import { getSupabaseAdmin } from "@/lib/supabase";
import type { AgentRun, CronJob, DailyReport, KillLog, Opportunity, OpportunityStage, PortfolioSlot, RevenueReadyEvent, TodoItem, ValidationItem, CronDay } from "@/lib/types";
import fs from "fs";
import path from "path";

export interface MissionControlRepository {
  getOpportunities(): Promise<Opportunity[]>;
  getValidations(): Promise<ValidationItem[]>;
  getPortfolioSlots(): Promise<PortfolioSlot[]>;
  getAgentRuns(): Promise<AgentRun[]>;
  getReports(): Promise<DailyReport[]>;
  getKillLogs(): Promise<KillLog[]>;
  getCronJobs(): Promise<CronJob[]>;
  getTodos(): Promise<TodoItem[]>;
  getRevenueReadyEvents(): Promise<RevenueReadyEvent[]>;
  addTodo(title: string, priority: TodoItem["priority"]): Promise<TodoItem>;
  toggleTodo(id: string): Promise<TodoItem | null>;
  recordRevenueReady(opportunityId: string, projectName: string): Promise<RevenueReadyEvent>;
  advanceOpportunityStage(opportunityId: string, nextStage: OpportunityStage): Promise<Opportunity | null>;
  killPortfolioSlot(slotId: string, reason: string, killedBy: string): Promise<PortfolioSlot | null>;
  appendReport(summary: string): Promise<DailyReport>;
}

const opportunities: Opportunity[] = [
  { id: "opp-001", title: "Agent Reputation SDK", stage: "validation", confidence: 78, owner: "Miyabi" },
  { id: "opp-002", title: "Base Creator Intelligence", stage: "thesis", confidence: 64, owner: "Sora" },
  { id: "opp-003", title: "A2A Job Router", stage: "build", confidence: 82, owner: "Nagare" }
];

const validations: ValidationItem[] = [
  { opportunityId: "opp-001", decision: "CONDITIONAL_GO", rationale: "Strong demand, needs faster GTM proof", decidedAt: new Date().toISOString() }
];

const slots: PortfolioSlot[] = [
  { slotId: "slot-1", project: "zkBasecred", status: "active", sunsetAt: "2026-03-30" },
  { slotId: "slot-2", project: "Agent Royale", status: "active", sunsetAt: "2026-04-10" }
];

const runs: AgentRun[] = [
  { agentId: "main", name: "Mizutama", health: "healthy", lastRunAt: new Date().toISOString(), model: getAgentModel("main") },
  { agentId: "pipeline-controller", name: "Taiga", health: "healthy", lastRunAt: new Date().toISOString(), model: getAgentModel("pipeline-controller") },
  { agentId: "market-researcher", name: "Sora", health: "stalled", lastRunAt: new Date(Date.now() - 1000 * 60 * 190).toISOString(), model: getAgentModel("market-researcher") },
  { agentId: "opportunity-validator", name: "Miyabi", health: "healthy", lastRunAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(), model: getAgentModel("opportunity-validator") },
  { agentId: "portfolio-manager", name: "Mizuho", health: "healthy", lastRunAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(), model: getAgentModel("portfolio-manager") },
  { agentId: "product-architect", name: "Kagayaki", health: "offline", lastRunAt: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString(), model: getAgentModel("product-architect") },
  { agentId: "lead-developer", name: "Nagare", health: "healthy", lastRunAt: new Date().toISOString(), model: getAgentModel("lead-developer") },
  { agentId: "head-of-growth", name: "Himawari", health: "healthy", lastRunAt: new Date(Date.now() - 1000 * 60 * 60).toISOString(), model: getAgentModel("head-of-growth") },
  { agentId: "data-analyst", name: "Shizuku", health: "healthy", lastRunAt: new Date(Date.now() - 1000 * 60 * 120).toISOString(), model: getAgentModel("data-analyst") },
  { agentId: "security-engineer", name: "Kurogane", health: "healthy", lastRunAt: new Date(Date.now() - 1000 * 60 * 90).toISOString(), model: getAgentModel("security-engineer") },
  { agentId: "qa-auditor", name: "Komari", health: "offline", lastRunAt: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(), model: getAgentModel("qa-auditor") }
];

const reports: DailyReport[] = [
  { id: "rpt-001", summary: "1 thesis advanced to validation, 0 launches, 1 slot risk flagged.", createdAt: new Date().toISOString() }
];



const todos: TodoItem[] = [
  { id: "todo-1", title: "Wire OpenClaw session telemetry", status: "pending", priority: "high", createdAt: new Date().toISOString() },
  { id: "todo-2", title: "Add RLS policies", status: "pending", priority: "medium", createdAt: new Date().toISOString() },
  { id: "todo-3", title: "Finalize analytics widgets", status: "done", priority: "low", createdAt: new Date().toISOString() }
];

const revenueReadyEvents: RevenueReadyEvent[] = [
  { id: "rev-1", opportunityId: "opp-001", projectName: "Agent Reputation SDK", recordedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString() },
  { id: "rev-2", opportunityId: "opp-003", projectName: "A2A Job Router", recordedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 17).toISOString() }
];

const killLogs: KillLog[] = [];

// Agent name mapping
const agentNames: Record<string, string> = {
  "main": "Mizutama",
  "pipeline-controller": "Taiga", 
  "market-researcher": "Sora",
  "opportunity-validator": "Miyabi",
  "portfolio-manager": "Mizuho",
  "product-architect": "Kagayaki",
  "lead-developer": "Nagare", 
  "head-of-growth": "Himawari",
  "data-analyst": "Shizuku",
  "security-engineer": "Kurogane",
  "qa-auditor": "Komari"
};

// Status colors for different job types
const jobColors = [
  "#6366f1", "#eab308", "#22c55e", "#ef4444", "#a855f7", 
  "#f97316", "#06b6d4", "#ec4899", "#14b8a6", "#8b5cf6"
];

function parseCronExpression(expr: string): { schedule: string; day: CronJob["day"]; frequency: CronJob["frequency"] } {
  const parts = expr.split(" ");
  if (parts.length !== 5) return { schedule: expr, day: "All", frequency: "daily" };
  
  const [min, hour, dayOfMonth, month, dayOfWeek] = parts;
  
  // Handle frequency patterns
  if (dayOfMonth.includes("*/")) {
    const interval = parseInt(dayOfMonth.substring(2));
    return {
      schedule: `${hour}:${min.padStart(2, '0')}`,
      day: "All",
      frequency: interval === 1 ? "daily" : "weekly" // Simplify complex intervals to weekly
    };
  }
  
  // Handle weekly patterns  
  if (dayOfWeek !== "*") {
    const dayMap: CronDay[] = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
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

function readOpenClawConfig() {
  try {
    const configPath = path.join(process.env.HOME || "/home/phan_harry", ".openclaw/openclaw.json");
    if (!fs.existsSync(configPath)) return null;
    
    const content = fs.readFileSync(configPath, "utf-8");
    return JSON.parse(content);
  } catch (error) {
    console.warn("Failed to read OpenClaw config:", error);
    return null;
  }
}

function getAgentModel(agentId: string): string {
  const config = readOpenClawConfig();
  if (!config) return "Unknown";
  
  const agents = config.agents?.list || [];
  const agent = agents.find((a: any) => a.id === agentId);
  
  if (agent?.model?.primary) {
    return agent.model.primary.replace("anthropic/", "");
  }
  
  // Fallback to default model
  const defaultModel = config.agents?.defaults?.model?.primary || "Unknown";
  return defaultModel.replace("anthropic/", "");
}

function readOpenClawCronJobs(): CronJob[] {
  try {
    const home = process.env.HOME || "/home/phan_harry";
    const cronPath = path.join(home, ".openclaw/cron/jobs.json");
    
    console.log(`[CRON] Environment: NODE_ENV=${process.env.NODE_ENV}, VERCEL=${process.env.VERCEL}`);
    console.log(`[CRON] HOME directory: ${home}`);
    console.log(`[CRON] Reading from: ${cronPath}`);
    console.log(`[CRON] File exists: ${fs.existsSync(cronPath)}`);
    
    if (!fs.existsSync(cronPath)) {
      console.log(`[CRON] File doesn't exist - likely in Vercel production environment`);
      console.log(`[CRON] Current working directory: ${process.cwd()}`);
      console.log(`[CRON] Files in project root:`, fs.readdirSync(process.cwd()).slice(0, 10));
      return [];
    }
    
    const content = fs.readFileSync(cronPath, "utf-8");
    const data = JSON.parse(content);
    console.log(`[CRON] Found ${data.jobs?.length || 0} total jobs, ${data.jobs?.filter((j: any) => j.enabled).length || 0} enabled`);
    
    const result = data.jobs
      .filter((job: any) => job.enabled)
      .map((job: any, index: number) => {
        let scheduleStr: string, day: CronJob["day"], frequency: CronJob["frequency"];
        
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
          status: status as CronJob["status"],
          color: jobColors[index % jobColors.length]
        };
      });
    
    console.log(`[CRON] Returning ${result.length} parsed jobs:`, result.map((j: CronJob) => `${j.title} @ ${j.schedule}`));
    return result;
  } catch (error) {
    console.warn("[CRON] Failed to read OpenClaw cron jobs:", error);
    return [];
  }
}

function createInMemoryRepository(): MissionControlRepository {
  return {
    getOpportunities: async () => opportunities,
    getValidations: async () => validations,
    getPortfolioSlots: async () => slots,
    getAgentRuns: async () => runs,
    getReports: async () => reports,
    getKillLogs: async () => killLogs,
    getCronJobs: async () => {
      const liveJobs = readOpenClawCronJobs();
      console.log("In-memory getCronJobs: returning", liveJobs.length, "live jobs");
      return liveJobs;
    },
    getTodos: async () => todos,
    getRevenueReadyEvents: async () => revenueReadyEvents,
    addTodo: async (title, priority) => {
      const item: TodoItem = { id: `todo-${Date.now()}`, title, status: "pending", priority, createdAt: new Date().toISOString() };
      todos.unshift(item);
      return item;
    },
    toggleTodo: async (id) => {
      const item = todos.find((t) => t.id === id);
      if (!item) return null;
      item.status = item.status === "pending" ? "done" : "pending";
      return item;
    },
    recordRevenueReady: async (opportunityId, projectName) => {
      const event: RevenueReadyEvent = {
        id: `rev-${Date.now()}`,
        opportunityId,
        projectName,
        recordedAt: new Date().toISOString()
      };
      revenueReadyEvents.unshift(event);
      return event;
    },
    advanceOpportunityStage: async (opportunityId, nextStage) => {
      const item = opportunities.find((o) => o.id === opportunityId);
      if (!item) return null;
      item.stage = nextStage;
      return item;
    },
    killPortfolioSlot: async (slotId, reason, killedBy) => {
      const slot = slots.find((s) => s.slotId === slotId);
      if (!slot) return null;
      slot.status = "sunset";
      killLogs.push({ id: `kill-${Date.now()}`, slotId, reason, killedBy, killedAt: new Date().toISOString() });
      return slot;
    },
    appendReport: async (summary) => {
      const report: DailyReport = { id: `rpt-${Date.now()}`, summary, createdAt: new Date().toISOString() };
      reports.unshift(report);
      return report;
    }
  };
}

function createSupabaseRepository(): MissionControlRepository {
  const supabase = getSupabaseAdmin();
  if (!supabase) return createInMemoryRepository();
  const fallback = createInMemoryRepository();

  return {
    getOpportunities: async () => {
      const { data, error } = await supabase.from("opportunities").select("id,title,stage,confidence,owner").order("created_at", { ascending: false });
      if (error || !data) return [];
      return data as Opportunity[];
    },
    getValidations: async () => {
      const { data, error } = await supabase.from("validations").select("opportunity_id,decision,rationale,decided_at").order("decided_at", { ascending: false });
      if (error || !data) return [];
      return data.map((v) => ({ opportunityId: v.opportunity_id, decision: v.decision, rationale: v.rationale, decidedAt: v.decided_at })) as ValidationItem[];
    },
    getPortfolioSlots: async () => {
      const { data, error } = await supabase.from("portfolio_slots").select("slot_id,project,status,sunset_at").order("slot_id", { ascending: true });
      if (error || !data) return [];
      return data.map((s) => ({ slotId: s.slot_id, project: s.project, status: s.status, sunsetAt: s.sunset_at })) as PortfolioSlot[];
    },
    getAgentRuns: async () => {
      const { data, error } = await supabase.from("agent_runs").select("agent_id,name,health,last_run_at").order("last_run_at", { ascending: false });
      if (error || !data) return fallback.getAgentRuns();
      return data.map((r) => ({ 
        agentId: r.agent_id, 
        name: r.name, 
        health: r.health, 
        lastRunAt: r.last_run_at,
        model: getAgentModel(r.agent_id)
      })) as AgentRun[];
    },
    getReports: async () => {
      const { data, error } = await supabase.from("reports").select("id,summary,created_at").order("created_at", { ascending: false });
      if (error || !data) return [];
      return data.map((r) => ({ id: r.id, summary: r.summary, createdAt: r.created_at })) as DailyReport[];
    },
    getKillLogs: async () => {
      const { data, error } = await supabase.from("kill_logs").select("id,slot_id,reason,killed_at,killed_by").order("killed_at", { ascending: false });
      if (error || !data) return [];
      return data.map((k) => ({ id: k.id, slotId: k.slot_id, reason: k.reason, killedAt: k.killed_at, killedBy: k.killed_by })) as KillLog[];
    },
    getCronJobs: async () => {
      // Try Supabase first (synced data)
      const { data, error } = await supabase
        .from("cron_jobs")
        .select("id,title,owner,schedule,day,frequency,status,color")
        .order("title", { ascending: true });
      
      if (!error && data && data.length > 0) {
        console.log("[SUPABASE-REPO] Found", data.length, "synced cron jobs from Supabase");
        return data as CronJob[];
      }
      
      // Fallback to direct file read (development mode)
      console.log("[SUPABASE-REPO] No Supabase data, trying direct OpenClaw read");
      const liveJobs = readOpenClawCronJobs();
      
      if (liveJobs.length > 0) {
        console.log("[SUPABASE-REPO] Found", liveJobs.length, "jobs from direct OpenClaw read");
        return liveJobs;
      }
      
      // Final fallback - empty state with sync instructions
      console.log("[SUPABASE-REPO] No data found - returning sync instruction");
      return [
        {
          id: "sync-instruction",
          title: "🔄 Run sync to populate data", 
          owner: "System",
          schedule: "Manual",
          day: "All" as const,
          frequency: "always" as const,
          status: "delayed" as const,
          color: "#f97316"
        }
      ];
    },
    getTodos: async () => {
      const { data, error } = await supabase.from("todos").select("id,title,status,priority,created_at").order("created_at", { ascending: false });
      if (error || !data) return fallback.getTodos();
      return data.map((t) => ({ id: t.id, title: t.title, status: t.status, priority: t.priority, createdAt: t.created_at })) as TodoItem[];
    },
    getRevenueReadyEvents: async () => {
      const { data, error } = await supabase.from("revenue_ready_events").select("id,opportunity_id,project_name,recorded_at").order("recorded_at", { ascending: false });
      if (error || !data) return fallback.getRevenueReadyEvents();
      return data.map((r) => ({ id: r.id, opportunityId: r.opportunity_id, projectName: r.project_name, recordedAt: r.recorded_at })) as RevenueReadyEvent[];
    },
    addTodo: async (title, priority) => {
      const payload = { id: `todo-${Date.now()}`, title, status: "pending", priority, created_at: new Date().toISOString() };
      const { data, error } = await supabase.from("todos").insert(payload).select("id,title,status,priority,created_at").single();
      if (error || !data) return fallback.addTodo(title, priority);
      return { id: data.id, title: data.title, status: data.status, priority: data.priority, createdAt: data.created_at };
    },
    toggleTodo: async (id) => {
      const { data: current } = await supabase.from("todos").select("status").eq("id", id).single();
      if (!current) return fallback.toggleTodo(id);
      const next = current.status === "pending" ? "done" : "pending";
      const { data, error } = await supabase.from("todos").update({ status: next }).eq("id", id).select("id,title,status,priority,created_at").single();
      if (error || !data) return fallback.toggleTodo(id);
      return { id: data.id, title: data.title, status: data.status, priority: data.priority, createdAt: data.created_at };
    },
    recordRevenueReady: async (opportunityId, projectName) => {
      const payload = {
        id: `rev-${Date.now()}`,
        opportunity_id: opportunityId,
        project_name: projectName,
        recorded_at: new Date().toISOString()
      };
      const { data, error } = await supabase.from("revenue_ready_events").insert(payload).select("id,opportunity_id,project_name,recorded_at").single();
      if (error || !data) return fallback.recordRevenueReady(opportunityId, projectName);
      return { id: data.id, opportunityId: data.opportunity_id, projectName: data.project_name, recordedAt: data.recorded_at };
    },
    advanceOpportunityStage: async (opportunityId, nextStage) => {
      const { data, error } = await supabase.from("opportunities").update({ stage: nextStage }).eq("id", opportunityId).select("id,title,stage,confidence,owner").single();
      if (error || !data) return null;
      return data as Opportunity;
    },
    killPortfolioSlot: async (slotId, reason, killedBy) => {
      const { data, error } = await supabase.from("portfolio_slots").update({ status: "sunset" }).eq("slot_id", slotId).select("slot_id,project,status,sunset_at").single();
      if (error || !data) return null;
      await supabase.from("kill_logs").insert({ id: `kill-${Date.now()}`, slot_id: slotId, reason, killed_by: killedBy, killed_at: new Date().toISOString() });
      return { slotId: data.slot_id, project: data.project, status: data.status, sunsetAt: data.sunset_at } as PortfolioSlot;
    },
    appendReport: async (summary) => {
      const payload = { id: `rpt-${Date.now()}`, summary, created_at: new Date().toISOString() };
      const { data, error } = await supabase.from("reports").insert(payload).select("id,summary,created_at").single();
      if (error || !data) return { id: payload.id, summary, createdAt: payload.created_at };
      return { id: data.id, summary: data.summary, createdAt: data.created_at };
    }
  };
}

export const repo: MissionControlRepository = createSupabaseRepository();
