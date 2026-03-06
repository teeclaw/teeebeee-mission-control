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

export interface CronJob {
  id: string;
  title: string;
  owner: string;
  schedule: string;
  day: "Mon" | "Tue" | "Wed" | "Thu" | "Fri" | "Sat" | "Sun";
  status: "healthy" | "delayed" | "failed";
}

export interface TodoItem {
  id: string;
  title: string;
  status: "pending" | "done";
  priority: "low" | "medium" | "high";
  createdAt: string;
}
