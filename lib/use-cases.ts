import { repo } from "@/lib/repository";
import type { OpportunityStage, TodoItem } from "@/lib/types";

const stageOrder: OpportunityStage[] = ["signal", "thesis", "validation", "build", "launch"];

// Map agent names to their roles
function getAgentRole(agentName: string): string {
  const roleMap: Record<string, string> = {
    'Miyabi': 'VALIDATOR',
    'Sora': 'RESEARCHER', 
    'Taiga': 'CONTROLLER',
    'Mizuho': 'MANAGER',
    'Nagare': 'DEVELOPER',
    'Himawari': 'GROWTH',
    'Shizuku': 'ANALYST',
    'Kurogane': 'SECURITY',
    'Komari': 'QA',
    'Kagayaki': 'ARCHITECT',
    'Teeebeee': 'CEO'
  };
  
  return roleMap[agentName] || 'AGENT';
}

function parseAllowedWallets() {
  return (process.env.CHAIRMAN_WALLETS || "")
    .split(",")
    .map((v) => v.trim().toLowerCase())
    .filter(Boolean);
}

export const useCases = {
  listPipeline: async () => repo.getOpportunities(),
  listPipelineWithDecisions: async () => {
    const [opportunities, validations] = await Promise.all([
      repo.getOpportunities(),
      repo.getValidations()
    ]);
    
    // Create a map of opportunity ID to validation decision
    const decisionsMap = new Map();
    validations.forEach(v => {
      decisionsMap.set(v.opportunityId, v.decision);
    });
    
    // Add decision and role fields to each opportunity
    return opportunities.map(opp => ({
      ...opp,
      role: getAgentRole(opp.owner),
      decision: decisionsMap.get(opp.id) || null
    }));
  },
  listValidationQueue: async () => {
    const [opps, validations] = await Promise.all([repo.getOpportunities(), repo.getValidations()]);
    const validatedIds = new Set(validations.map((v) => v.opportunityId));
    return opps.filter((o) => o.stage === "validation" && !validatedIds.has(o.id));
  },
  listPortfolio: async () => repo.getPortfolioSlots(),
  listAgentRuns: async () => repo.getAgentRuns(),
  listReports: async () => repo.getReports(),
  listKillLogs: async () => repo.getKillLogs(),
  listCronJobs: async () => repo.getCronJobs(),
  listTodos: async () => repo.getTodos(),
  listRevenueReadyEvents: async () => repo.getRevenueReadyEvents(),
  getOrgChart: async () => {
    const [nodes, edges] = await Promise.all([repo.getOrgNodes(), repo.getOrgEdges()]);
    return { nodes, edges };
  },
  listActiveBlockers: async () => repo.getAgentBlockers(),
  getAgentDetail: async (agentId: string) => repo.getAgentDetail(agentId),
  chairmanGate: (wallet: string | null) => {
    const allowed = parseAllowedWallets();
    if (!allowed.length) return { allowed: true, reason: "CHAIRMAN_WALLETS not set (dev mode)" };
    if (!wallet) return { allowed: false, reason: "Missing wallet" };
    const isAllowed = allowed.includes(wallet.toLowerCase());
    return { allowed: isAllowed, reason: isAllowed ? "ok" : "wallet not allowlisted" };
  },
  advanceOpportunityStage: async (opportunityId: string, nextStage: OpportunityStage) => {
    if (!stageOrder.includes(nextStage)) return { ok: false, error: "Invalid stage" };
    const item = await repo.advanceOpportunityStage(opportunityId, nextStage);
    if (!item) return { ok: false, error: "Opportunity not found" };
    return { ok: true, data: item };
  },
  killPortfolioSlot: async (slotId: string, reason: string, killedBy: string) => {
    if (!reason.trim()) return { ok: false, error: "Reason is required" };
    const slot = await repo.killPortfolioSlot(slotId, reason, killedBy);
    if (!slot) return { ok: false, error: "Slot not found" };
    return { ok: true, data: slot };
  },
  appendDailyReport: async (summary: string) => {
    if (!summary.trim()) return { ok: false, error: "Summary is required" };
    const report = await repo.appendReport(summary);
    return { ok: true, data: report };
  },
  addTodo: async (title: string, priority: TodoItem["priority"]) => {
    if (!title.trim()) return { ok: false, error: "Title is required" };
    const item = await repo.addTodo(title.trim(), priority);
    return { ok: true, data: item };
  },
  toggleTodo: async (id: string) => {
    const item = await repo.toggleTodo(id);
    if (!item) return { ok: false, error: "Todo not found" };
    return { ok: true, data: item };
  },
  recordRevenueReady: async (opportunityId: string, projectName: string) => {
    if (!opportunityId.trim() || !projectName.trim()) return { ok: false, error: "opportunityId and projectName are required" };
    const data = await repo.recordRevenueReady(opportunityId.trim(), projectName.trim());
    return { ok: true, data };
  }
};
