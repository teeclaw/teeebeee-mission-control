import { getSupabaseAdmin } from "@/lib/supabase";
import type {
  AgentBlocker,
  AgentDetail,
  AgentRun,
  CronJob,
  DailyReport,
  KillLog,
  Opportunity,
  OpportunityStage,
  OrgEdge,
  OrgNode,
  PortfolioSlot,
  RevenueReadyEvent,
  TodoItem,
  ValidationItem
} from "@/lib/types";

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
  getOrgNodes(): Promise<OrgNode[]>;
  getOrgEdges(): Promise<OrgEdge[]>;
  getAgentBlockers(): Promise<AgentBlocker[]>;
  getAgentDetail(agentId: string): Promise<AgentDetail | null>;
  addTodo(title: string, priority: TodoItem["priority"]): Promise<TodoItem>;
  toggleTodo(id: string): Promise<TodoItem | null>;
  recordRevenueReady(opportunityId: string, projectName: string): Promise<RevenueReadyEvent>;
  advanceOpportunityStage(opportunityId: string, nextStage: OpportunityStage): Promise<Opportunity | null>;
  killPortfolioSlot(slotId: string, reason: string, killedBy: string): Promise<PortfolioSlot | null>;
  appendReport(summary: string): Promise<DailyReport>;
}

function requireSupabase() {
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    throw new Error("DATA_SOURCE_UNAVAILABLE: Supabase admin client not configured");
  }
  return supabase;
}

function ensure<T>(data: T | null, error: { message: string } | null, table: string): T {
  if (error) throw new Error(`DATA_SOURCE_UNAVAILABLE:${table}:${error.message}`);
  if (data === null) throw new Error(`DATA_SOURCE_UNAVAILABLE:${table}:null-data`);
  return data;
}

function parseHealthFromStatus(status: string): AgentRun["health"] {
  if (status === "error" || status === "blocked") return "offline";
  if (status === "idle") return "stalled";
  return "healthy";
}

function createSupabaseRepository(): MissionControlRepository {
  const supabase = requireSupabase();

  return {
    getOpportunities: async () => {
      const { data, error } = await supabase.from("opportunities").select("id,title,stage,confidence,owner").order("created_at", { ascending: false });
      return ensure(data, error, "opportunities") as Opportunity[];
    },
    getValidations: async () => {
      const { data, error } = await supabase.from("validations").select("opportunity_id,decision,rationale,decided_at").order("decided_at", { ascending: false });
      return ensure(data, error, "validations").map((v: any) => ({
        opportunityId: v.opportunity_id,
        decision: v.decision,
        rationale: v.rationale,
        decidedAt: v.decided_at
      })) as ValidationItem[];
    },
    getPortfolioSlots: async () => {
      const { data, error } = await supabase.from("portfolio_slots").select("slot_id,project,status,sunset_at").order("slot_id", { ascending: true });
      return ensure(data, error, "portfolio_slots").map((s: any) => ({
        slotId: s.slot_id,
        project: s.project,
        status: s.status,
        sunsetAt: s.sunset_at
      })) as PortfolioSlot[];
    },
    getAgentRuns: async () => {
      const { data, error } = await supabase
        .from("org_nodes")
        .select("agent_id,name,status,last_event_at")
        .order("level", { ascending: true });

      if (error && error.message.includes("Could not find the table 'public.org_nodes'")) {
        const { data: legacy, error: legacyErr } = await supabase
          .from("agent_runs")
          .select("agent_id,name,health,last_run_at")
          .order("last_run_at", { ascending: false });
        const rows = ensure(legacy, legacyErr, "agent_runs");
        return rows.map((r: any) => ({
          agentId: r.agent_id,
          name: r.name,
          health: r.health,
          lastRunAt: r.last_run_at,
          model: "live"
        })) as AgentRun[];
      }

      const rows = ensure(data, error, "org_nodes");
      return rows.map((r: any) => ({
        agentId: r.agent_id,
        name: r.name,
        health: parseHealthFromStatus(r.status),
        lastRunAt: r.last_event_at || new Date(0).toISOString(),
        model: "live"
      })) as AgentRun[];
    },
    getReports: async () => {
      const { data, error } = await supabase.from("reports").select("id,summary,created_at").order("created_at", { ascending: false });
      return ensure(data, error, "reports").map((r: any) => ({ id: r.id, summary: r.summary, createdAt: r.created_at })) as DailyReport[];
    },
    getKillLogs: async () => {
      const { data, error } = await supabase.from("kill_logs").select("id,slot_id,reason,killed_at,killed_by").order("killed_at", { ascending: false });
      return ensure(data, error, "kill_logs").map((k: any) => ({ id: k.id, slotId: k.slot_id, reason: k.reason, killedAt: k.killed_at, killedBy: k.killed_by })) as KillLog[];
    },
    getCronJobs: async () => {
      const { data, error } = await supabase
        .from("cron_jobs")
        .select("id,title,owner,schedule,day,frequency,status,color")
        .order("title", { ascending: true });

      return ensure(data, error, "cron_jobs") as CronJob[];
    },
    getTodos: async () => {
      const { data, error } = await supabase.from("todos").select("id,title,status,priority,created_at").order("created_at", { ascending: false });
      return ensure(data, error, "todos").map((t: any) => ({ id: t.id, title: t.title, status: t.status, priority: t.priority, createdAt: t.created_at })) as TodoItem[];
    },
    getRevenueReadyEvents: async () => {
      const { data, error } = await supabase.from("revenue_ready_events").select("id,opportunity_id,project_name,recorded_at").order("recorded_at", { ascending: false });
      return ensure(data, error, "revenue_ready_events").map((r: any) => ({ id: r.id, opportunityId: r.opportunity_id, projectName: r.project_name, recordedAt: r.recorded_at })) as RevenueReadyEvent[];
    },
    getOrgNodes: async () => {
      let { data, error }: any = await supabase
        .from("org_nodes")
        .select("agent_id,name,role,team,manager_id,level,status,health_score,last_event_at,freshness_sec,model_primary,model_fallback")
        .order("level", { ascending: true });

      if (error && error.message.includes("column org_nodes.model_primary does not exist")) {
        const legacy = await supabase
          .from("org_nodes")
          .select("agent_id,name,role,team,manager_id,level,status,health_score,last_event_at,freshness_sec")
          .order("level", { ascending: true });
        data = legacy.data;
        error = legacy.error;
      }

      if (error && error.message.includes("Could not find the table 'public.org_nodes'")) {
        const { data: legacy, error: legacyErr } = await supabase
          .from("agent_runs")
          .select("agent_id,name,health,last_run_at")
          .order("last_run_at", { ascending: false });
        const rows = ensure(legacy, legacyErr, "agent_runs");
        return rows.map((r: any) => ({
          agentId: r.agent_id,
          name: r.name,
          role: "AGENT",
          team: "Unassigned",
          managerId: null,
          level: 3,
          status: r.health === "healthy" ? "running" : r.health === "stalled" ? "idle" : "offline",
          healthScore: r.health === "healthy" ? 90 : r.health === "stalled" ? 50 : 20,
          lastEventAt: r.last_run_at,
          freshnessSec: null
        })) as OrgNode[];
      }

      return ensure(data, error, "org_nodes").map((n: any) => ({
        agentId: n.agent_id,
        name: n.name,
        role: n.role,
        team: n.team,
        managerId: n.manager_id,
        level: n.level,
        status: n.status,
        healthScore: n.health_score,
        lastEventAt: n.last_event_at,
        freshnessSec: n.freshness_sec,
        modelPrimary: n.model_primary || null,
        modelFallback: n.model_fallback || null
      })) as OrgNode[];
    },
    getOrgEdges: async () => {
      const { data, error } = await supabase.from("org_edges").select("id,from_agent_id,to_agent_id,relation_type");
      return ensure(data, error, "org_edges").map((e: any) => ({
        id: e.id,
        fromAgentId: e.from_agent_id,
        toAgentId: e.to_agent_id,
        relationType: e.relation_type
      })) as OrgEdge[];
    },
    getAgentBlockers: async () => {
      const { data, error } = await supabase
        .from("agent_blockers")
        .select("id,agent_id,severity,title,created_at,resolved_at")
        .is("resolved_at", null)
        .order("created_at", { ascending: false });
      return ensure(data, error, "agent_blockers").map((b: any) => ({
        id: b.id,
        agentId: b.agent_id,
        severity: b.severity,
        title: b.title,
        createdAt: b.created_at,
        resolvedAt: b.resolved_at
      })) as AgentBlocker[];
    },
    getAgentDetail: async (agentId) => {
      let { data: n, error: nErr }: any = await supabase
        .from("org_nodes")
        .select("agent_id,name,role,team,manager_id,level,status,health_score,last_event_at,freshness_sec,model_primary,model_fallback")
        .eq("agent_id", agentId)
        .single();

      if (nErr && nErr.message.includes("column org_nodes.model_primary does not exist")) {
        const legacy = await supabase
          .from("org_nodes")
          .select("agent_id,name,role,team,manager_id,level,status,health_score,last_event_at,freshness_sec")
          .eq("agent_id", agentId)
          .single();
        n = legacy.data;
        nErr = legacy.error;
      }
      if (nErr) throw new Error(`DATA_SOURCE_UNAVAILABLE:org_nodes:${nErr.message}`);
      if (!n) return null;

      const { data: blockers, error: bErr } = await supabase
        .from("agent_blockers")
        .select("id,agent_id,severity,title,created_at,resolved_at")
        .eq("agent_id", agentId)
        .order("created_at", { ascending: false });
      if (bErr) throw new Error(`DATA_SOURCE_UNAVAILABLE:agent_blockers:${bErr.message}`);

      const { data: task, error: tErr } = await supabase
        .from("agent_task_current")
        .select("title,project,pipeline_stage,started_at")
        .eq("agent_id", agentId)
        .maybeSingle();
      if (tErr) throw new Error(`DATA_SOURCE_UNAVAILABLE:agent_task_current:${tErr.message}`);

      const { data: metrics, error: mErr } = await supabase
        .from("agent_metrics_7d")
        .select("throughput,error_rate,retries")
        .eq("agent_id", agentId)
        .maybeSingle();
      if (mErr) throw new Error(`DATA_SOURCE_UNAVAILABLE:agent_metrics_7d:${mErr.message}`);

      return {
        node: {
          agentId: n.agent_id,
          name: n.name,
          role: n.role,
          team: n.team,
          managerId: n.manager_id,
          level: n.level,
          status: n.status,
          healthScore: n.health_score,
          lastEventAt: n.last_event_at,
          freshnessSec: n.freshness_sec,
          modelPrimary: n.model_primary || null,
          modelFallback: n.model_fallback || null
        },
        blockers: (blockers || []).map((b: any) => ({
          id: b.id,
          agentId: b.agent_id,
          severity: b.severity,
          title: b.title,
          createdAt: b.created_at,
          resolvedAt: b.resolved_at
        })),
        currentTask: task
          ? {
              title: task.title,
              project: task.project,
              pipelineStage: task.pipeline_stage,
              startedAt: task.started_at
            }
          : null,
        metrics7d: metrics
          ? {
              throughput: metrics.throughput,
              errorRate: metrics.error_rate,
              retries: metrics.retries
            }
          : null
      };
    },
    addTodo: async (title, priority) => {
      const payload = { id: `todo-${Date.now()}`, title, status: "pending", priority, created_at: new Date().toISOString() };
      const { data, error } = await supabase.from("todos").insert(payload).select("id,title,status,priority,created_at").single();
      const row = ensure(data, error, "todos.insert") as any;
      return { id: row.id, title: row.title, status: row.status, priority: row.priority, createdAt: row.created_at };
    },
    toggleTodo: async (id) => {
      const { data: current, error: currentErr } = await supabase.from("todos").select("status").eq("id", id).single();
      if (currentErr) throw new Error(`DATA_SOURCE_UNAVAILABLE:todos:${currentErr.message}`);
      if (!current) return null;
      const next = current.status === "pending" ? "done" : "pending";
      const { data, error } = await supabase.from("todos").update({ status: next }).eq("id", id).select("id,title,status,priority,created_at").single();
      const row = ensure(data, error, "todos.update") as any;
      return { id: row.id, title: row.title, status: row.status, priority: row.priority, createdAt: row.created_at };
    },
    recordRevenueReady: async (opportunityId, projectName) => {
      const payload = {
        id: `rev-${Date.now()}`,
        opportunity_id: opportunityId,
        project_name: projectName,
        recorded_at: new Date().toISOString()
      };
      const { data, error } = await supabase.from("revenue_ready_events").insert(payload).select("id,opportunity_id,project_name,recorded_at").single();
      const row = ensure(data, error, "revenue_ready_events.insert") as any;
      return { id: row.id, opportunityId: row.opportunity_id, projectName: row.project_name, recordedAt: row.recorded_at };
    },
    advanceOpportunityStage: async (opportunityId, nextStage) => {
      const { data, error } = await supabase.from("opportunities").update({ stage: nextStage }).eq("id", opportunityId).select("id,title,stage,confidence,owner").single();
      if (error) throw new Error(`DATA_SOURCE_UNAVAILABLE:opportunities.update:${error.message}`);
      return data as Opportunity | null;
    },
    killPortfolioSlot: async (slotId, reason, killedBy) => {
      const { data, error } = await supabase.from("portfolio_slots").update({ status: "sunset" }).eq("slot_id", slotId).select("slot_id,project,status,sunset_at").single();
      if (error) throw new Error(`DATA_SOURCE_UNAVAILABLE:portfolio_slots.update:${error.message}`);
      if (!data) return null;
      const { error: logErr } = await supabase.from("kill_logs").insert({ id: `kill-${Date.now()}`, slot_id: slotId, reason, killed_by: killedBy, killed_at: new Date().toISOString() });
      if (logErr) throw new Error(`DATA_SOURCE_UNAVAILABLE:kill_logs.insert:${logErr.message}`);
      return { slotId: data.slot_id, project: data.project, status: data.status, sunsetAt: data.sunset_at } as PortfolioSlot;
    },
    appendReport: async (summary) => {
      const payload = { id: `rpt-${Date.now()}`, summary, created_at: new Date().toISOString() };
      const { data, error } = await supabase.from("reports").insert(payload).select("id,summary,created_at").single();
      const row = ensure(data, error, "reports.insert") as any;
      return { id: row.id, summary: row.summary, createdAt: row.created_at };
    }
  };
}

if (process.env.NODE_ENV === "production" && process.env.REAL_DATA_ONLY !== "true") {
  console.warn("[REAL_DATA_ONLY] Expected REAL_DATA_ONLY=true in production");
}

export const repo: MissionControlRepository = createSupabaseRepository();
