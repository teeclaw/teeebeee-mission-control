export type OpportunityStage = "signal" | "thesis" | "validation" | "build" | "launch";
export type Decision = "GO" | "NO_GO" | "CONDITIONAL_GO";

export interface Opportunity {
  id: string;
  title: string;
  stage: OpportunityStage;
  confidence: number;
  owner: string;
}

export interface KillLog {
  id: string;
  slotId: string;
  reason: string;
  killedAt: string;
  killedBy: string;
}

export interface ValidationItem {
  opportunityId: string;
  decision: Decision;
  rationale: string;
  decidedAt: string;
}

export interface PortfolioSlot {
  slotId: string;
  project: string;
  status: "active" | "sunset";
  sunsetAt: string;
}

export interface AgentRun {
  agentId: string;
  name: string;
  health: "healthy" | "stalled" | "offline";
  lastRunAt: string;
}

export interface DailyReport {
  id: string;
  summary: string;
  createdAt: string;
}
