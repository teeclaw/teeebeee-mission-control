export type OpportunityStage = "signal" | "thesis" | "validation" | "build" | "launch";
export type Decision = "GO" | "NO_GO" | "CONDITIONAL_GO";

export interface Opportunity {
  id: string;
  title: string;
  stage: OpportunityStage;
  confidence: number;
  owner: string;
  role?: string;
  decision?: Decision | null;
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
  model: string;
}

export type AgentLiveStatus = "idle" | "running" | "blocked" | "error" | "offline";

export interface OrgNode {
  agentId: string;
  name: string;
  role: string;
  team: string;
  managerId: string | null;
  level: number;
  status: AgentLiveStatus;
  healthScore: number;
  lastEventAt: string | null;
  freshnessSec: number | null;
  modelPrimary?: string | null;
  modelFallback?: string | null;
}

export interface OrgEdge {
  id: string;
  fromAgentId: string;
  toAgentId: string;
  relationType: "solid" | "dotted";
}

export interface AgentBlocker {
  id: string;
  agentId: string;
  severity: "low" | "medium" | "high" | "critical";
  title: string;
  createdAt: string;
  resolvedAt: string | null;
}

export interface AgentDetail {
  node: OrgNode;
  blockers: AgentBlocker[];
  currentTask: {
    title: string;
    project: string | null;
    pipelineStage: string | null;
    startedAt: string | null;
  } | null;
  metrics7d: {
    throughput: number;
    errorRate: number;
    retries: number;
  } | null;
}

export interface DailyReport {
  id: string;
  summary: string;
  createdAt: string;
}

export type CronDay = "Sun" | "Mon" | "Tue" | "Wed" | "Thu" | "Fri" | "Sat";

export interface CronJob {
  id: string;
  title: string;
  owner: string;
  schedule: string;
  day: CronDay | "All";
  frequency: "always" | "daily" | "weekly";
  status: "healthy" | "delayed" | "failed";
  color: string;
}

export interface TodoItem {
  id: string;
  title: string;
  status: "pending" | "done";
  priority: "low" | "medium" | "high";
  createdAt: string;
}

export interface RevenueReadyEvent {
  id: string;
  opportunityId: string;
  projectName: string;
  recordedAt: string;
}
