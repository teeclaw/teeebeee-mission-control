import { getSupabaseAdmin } from "@/lib/supabase";
import type { AgentRun, DailyReport, KillLog, Opportunity, OpportunityStage, PortfolioSlot, ValidationItem } from "@/lib/types";

export interface MissionControlRepository {
  getOpportunities(): Promise<Opportunity[]>;
  getValidations(): Promise<ValidationItem[]>;
  getPortfolioSlots(): Promise<PortfolioSlot[]>;
  getAgentRuns(): Promise<AgentRun[]>;
  getReports(): Promise<DailyReport[]>;
  getKillLogs(): Promise<KillLog[]>;
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
  { agentId: "pipeline-controller", name: "Taiga", health: "healthy", lastRunAt: new Date().toISOString() },
  { agentId: "market-researcher", name: "Sora", health: "stalled", lastRunAt: new Date(Date.now() - 1000 * 60 * 190).toISOString() },
  { agentId: "lead-developer", name: "Nagare", health: "healthy", lastRunAt: new Date().toISOString() }
];

const reports: DailyReport[] = [
  { id: "rpt-001", summary: "1 thesis advanced to validation, 0 launches, 1 slot risk flagged.", createdAt: new Date().toISOString() }
];

const killLogs: KillLog[] = [];

function createInMemoryRepository(): MissionControlRepository {
  return {
    getOpportunities: async () => opportunities,
    getValidations: async () => validations,
    getPortfolioSlots: async () => slots,
    getAgentRuns: async () => runs,
    getReports: async () => reports,
    getKillLogs: async () => killLogs,
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
      killLogs.push({
        id: `kill-${Date.now()}`,
        slotId,
        reason,
        killedBy,
        killedAt: new Date().toISOString()
      });
      return slot;
    },
    appendReport: async (summary) => {
      const report: DailyReport = {
        id: `rpt-${Date.now()}`,
        summary,
        createdAt: new Date().toISOString()
      };
      reports.unshift(report);
      return report;
    }
  };
}

function createSupabaseRepository(): MissionControlRepository {
  const supabase = getSupabaseAdmin();
  if (!supabase) return createInMemoryRepository();

  return {
    getOpportunities: async () => {
      const { data, error } = await supabase
        .from("opportunities")
        .select("id,title,stage,confidence,owner")
        .order("created_at", { ascending: false });
      if (error || !data) return [];
      return data as Opportunity[];
    },
    getValidations: async () => {
      const { data, error } = await supabase
        .from("validations")
        .select("opportunity_id,decision,rationale,decided_at")
        .order("decided_at", { ascending: false });
      if (error || !data) return [];
      return data.map((v) => ({
        opportunityId: v.opportunity_id,
        decision: v.decision,
        rationale: v.rationale,
        decidedAt: v.decided_at
      })) as ValidationItem[];
    },
    getPortfolioSlots: async () => {
      const { data, error } = await supabase
        .from("portfolio_slots")
        .select("slot_id,project,status,sunset_at")
        .order("slot_id", { ascending: true });
      if (error || !data) return [];
      return data.map((s) => ({
        slotId: s.slot_id,
        project: s.project,
        status: s.status,
        sunsetAt: s.sunset_at
      })) as PortfolioSlot[];
    },
    getAgentRuns: async () => {
      const { data, error } = await supabase
        .from("agent_runs")
        .select("agent_id,name,health,last_run_at")
        .order("last_run_at", { ascending: false });
      if (error || !data) return [];
      return data.map((r) => ({
        agentId: r.agent_id,
        name: r.name,
        health: r.health,
        lastRunAt: r.last_run_at
      })) as AgentRun[];
    },
    getReports: async () => {
      const { data, error } = await supabase
        .from("reports")
        .select("id,summary,created_at")
        .order("created_at", { ascending: false });
      if (error || !data) return [];
      return data.map((r) => ({
        id: r.id,
        summary: r.summary,
        createdAt: r.created_at
      })) as DailyReport[];
    },
    getKillLogs: async () => {
      const { data, error } = await supabase
        .from("kill_logs")
        .select("id,slot_id,reason,killed_at,killed_by")
        .order("killed_at", { ascending: false });
      if (error || !data) return [];
      return data.map((k) => ({
        id: k.id,
        slotId: k.slot_id,
        reason: k.reason,
        killedAt: k.killed_at,
        killedBy: k.killed_by
      })) as KillLog[];
    },
    advanceOpportunityStage: async (opportunityId, nextStage) => {
      const { data, error } = await supabase
        .from("opportunities")
        .update({ stage: nextStage })
        .eq("id", opportunityId)
        .select("id,title,stage,confidence,owner")
        .single();
      if (error || !data) return null;
      return data as Opportunity;
    },
    killPortfolioSlot: async (slotId, reason, killedBy) => {
      const { data, error } = await supabase
        .from("portfolio_slots")
        .update({ status: "sunset" })
        .eq("slot_id", slotId)
        .select("slot_id,project,status,sunset_at")
        .single();
      if (error || !data) return null;

      await supabase.from("kill_logs").insert({
        id: `kill-${Date.now()}`,
        slot_id: slotId,
        reason,
        killed_by: killedBy,
        killed_at: new Date().toISOString()
      });

      return {
        slotId: data.slot_id,
        project: data.project,
        status: data.status,
        sunsetAt: data.sunset_at
      } as PortfolioSlot;
    },
    appendReport: async (summary) => {
      const payload = {
        id: `rpt-${Date.now()}`,
        summary,
        created_at: new Date().toISOString()
      };
      const { data, error } = await supabase.from("reports").insert(payload).select("id,summary,created_at").single();
      if (error || !data) {
        return { id: payload.id, summary, createdAt: payload.created_at };
      }
      return {
        id: data.id,
        summary: data.summary,
        createdAt: data.created_at
      };
    }
  };
}

export const repo: MissionControlRepository = createSupabaseRepository();
