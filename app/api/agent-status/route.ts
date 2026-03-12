import { NextResponse } from "next/server";
import { readdir, readFile, stat } from "fs/promises";
import { join } from "path";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const WORKSPACE = process.env.OPENCLAW_WORKSPACE || "/home/phan_harry/.openclaw/workspace";
const OPENCLAW_DIR = process.env.OPENCLAW_DIR || "/home/phan_harry/.openclaw";
const DAILY_DIR = join(WORKSPACE, "memory/daily");

const AGENTS: Record<string, { emoji: string; role: string; agentDir: string }> = {
  main:       { emoji: "👑", role: "CEO / Chairman", agentDir: "main" },
  sora:       { emoji: "🔭", role: "Researcher", agentDir: "market-researcher" },
  miyabi:     { emoji: "✅", role: "Validator", agentDir: "opportunity-validator" },
  taiga:      { emoji: "🎯", role: "Controller", agentDir: "pipeline-controller" },
  mizuho:     { emoji: "📋", role: "Manager", agentDir: "portfolio-manager" },
  nagare:     { emoji: "⚡", role: "Lead Developer", agentDir: "lead-developer" },
  kagayaki:   { emoji: "🏗️", role: "Architect", agentDir: "product-architect" },
  himawari:   { emoji: "🌻", role: "Growth", agentDir: "head-of-growth" },
  shizuku:    { emoji: "📊", role: "Analyst", agentDir: "data-analyst" },
  kurogane:   { emoji: "🛡️", role: "Security", agentDir: "security-engineer" },
  komari:     { emoji: "🧪", role: "QA", agentDir: "qa-auditor" },
};

interface AgentStatusEntry {
  id: string;
  name: string;
  emoji: string;
  role: string;
  lastActive: string | null;
  currentTask: string | null;
  health: "active" | "idle" | "dead";
  tokenUsage: number;
  source: "session" | "daily" | "none";
}

async function getLatestDailyDir(): Promise<string | null> {
  try {
    const dirs = await readdir(DAILY_DIR);
    const sorted = dirs.filter(d => /^\d{4}-\d{2}-\d{2}$/.test(d)).sort().reverse();
    return sorted.length > 0 ? sorted[0] : null;
  } catch {
    return null;
  }
}

async function getDailyActivity(dayDir: string, agentId: string): Promise<{ lastActive: string | null; summary: string | null }> {
  const fileName = `${agentId}.md`;
  const filePath = join(DAILY_DIR, dayDir, fileName);
  try {
    const s = await stat(filePath);
    const content = await readFile(filePath, "utf-8");
    const firstLine = content.split("\n").find(l => l.trim().length > 10) || null;
    return { lastActive: s.mtime.toISOString(), summary: firstLine?.replace(/^#+\s*/, "").slice(0, 80) || null };
  } catch {
    return { lastActive: null, summary: null };
  }
}

async function getSessionActivity(agentDir: string): Promise<{ lastActive: string | null; summary: string | null; tokenUsage: number }> {
  const sessionsDir = join(OPENCLAW_DIR, "agents", agentDir, "sessions");
  try {
    const files = await readdir(sessionsDir);
    const jsonlFiles = files.filter(f => f.endsWith(".jsonl"));
    
    if (jsonlFiles.length === 0) {
      return { lastActive: null, summary: null, tokenUsage: 0 };
    }

    // Find the most recently modified session file
    let latestFile: string | null = null;
    let latestMtime = 0;

    for (const file of jsonlFiles) {
      try {
        const s = await stat(join(sessionsDir, file));
        if (s.mtimeMs > latestMtime) {
          latestMtime = s.mtimeMs;
          latestFile = file;
        }
      } catch {
        continue;
      }
    }

    if (!latestFile) {
      return { lastActive: null, summary: null, tokenUsage: 0 };
    }

    const lastActive = new Date(latestMtime).toISOString();

    // Read last few lines of the session file for context
    let summary: string | null = null;
    let tokenUsage = 0;
    
    try {
      const content = await readFile(join(sessionsDir, latestFile), "utf-8");
      const lines = content.trim().split("\n");
      
      // Parse last line for summary
      if (lines.length > 0) {
        const lastLine = lines[lines.length - 1];
        try {
          const parsed = JSON.parse(lastLine);
          if (parsed.content) {
            // Extract text content
            if (typeof parsed.content === "string") {
              summary = parsed.content.slice(0, 80);
            } else if (Array.isArray(parsed.content)) {
              const textPart = parsed.content.find((p: { type: string }) => p.type === "text");
              if (textPart?.text) {
                summary = textPart.text.slice(0, 80);
              }
            }
          }
          // Estimate token usage from file size
          const fileSize = (await stat(join(sessionsDir, latestFile))).size;
          tokenUsage = Math.min(Math.round(fileSize / 40), 100); // rough estimate, cap at 100%
        } catch {
          // JSON parse failed, skip
        }
      }
    } catch {
      // Read failed, skip
    }

    return { lastActive, summary, tokenUsage };
  } catch {
    return { lastActive: null, summary: null, tokenUsage: 0 };
  }
}

function determineHealth(lastActive: string | null): "active" | "idle" | "dead" {
  if (!lastActive) return "dead";
  const diff = Date.now() - new Date(lastActive).getTime();
  const hours = diff / (1000 * 60 * 60);
  if (hours < 2) return "active";
  if (hours < 24) return "idle";
  return "dead";
}

export async function GET() {
  try {
    const latestDay = await getLatestDailyDir();
    const agents: AgentStatusEntry[] = [];

    for (const [id, meta] of Object.entries(AGENTS)) {
      // Check both sources: OpenClaw sessions (primary) and daily memory files (secondary)
      const sessionActivity = await getSessionActivity(meta.agentDir);
      const dailyActivity = latestDay ? await getDailyActivity(latestDay, id) : { lastActive: null, summary: null };

      // Use the most recent activity from either source
      let lastActive: string | null = null;
      let currentTask: string | null = null;
      let tokenUsage = 0;
      let source: "session" | "daily" | "none" = "none";

      const sessionTime = sessionActivity.lastActive ? new Date(sessionActivity.lastActive).getTime() : 0;
      const dailyTime = dailyActivity.lastActive ? new Date(dailyActivity.lastActive).getTime() : 0;

      if (sessionTime >= dailyTime && sessionTime > 0) {
        lastActive = sessionActivity.lastActive;
        currentTask = sessionActivity.summary;
        tokenUsage = sessionActivity.tokenUsage;
        source = "session";
      } else if (dailyTime > 0) {
        lastActive = dailyActivity.lastActive;
        currentTask = dailyActivity.summary;
        tokenUsage = 0;
        source = "daily";
      }

      const health = determineHealth(lastActive);

      agents.push({
        id,
        name: id === "main" ? "Teeebeee" : id.charAt(0).toUpperCase() + id.slice(1),
        emoji: meta.emoji,
        role: meta.role,
        lastActive,
        currentTask,
        health,
        tokenUsage,
        source,
      });
    }

    return NextResponse.json({ data: agents, latestDay }, {
      headers: { "Cache-Control": "no-cache, no-store, must-revalidate" },
    });
  } catch (error) {
    console.error("[API] /api/agent-status error:", error);
    return NextResponse.json({ data: [], error: "Failed to read agent status" }, { status: 500 });
  }
}
