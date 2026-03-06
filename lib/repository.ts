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

export const repo: MissionControlRepository = createInMemoryRepository();
