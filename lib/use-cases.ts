import { repo } from "@/lib/repository";
import type { OpportunityStage } from "@/lib/types";

const stageOrder: OpportunityStage[] = ["signal", "thesis", "validation", "build", "launch"];

function parseAllowedWallets() {
  return (process.env.CHAIRMAN_WALLETS || "")
    .split(",")
    .map((v) => v.trim().toLowerCase())
    .filter(Boolean);
}

export const useCases = {
  listPipeline: async () => repo.getOpportunities(),
  listValidationQueue: async () => {
    const [opps, validations] = await Promise.all([repo.getOpportunities(), repo.getValidations()]);
    const validatedIds = new Set(validations.map((v) => v.opportunityId));
    return opps.filter((o) => o.stage === "validation" && !validatedIds.has(o.id));
  },
  listPortfolio: async () => repo.getPortfolioSlots(),
  listAgentRuns: async () => repo.getAgentRuns(),
  listReports: async () => repo.getReports(),
  listKillLogs: async () => repo.getKillLogs(),
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
  }
};
