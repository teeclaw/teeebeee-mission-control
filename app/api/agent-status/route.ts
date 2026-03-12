import { NextResponse } from "next/server";
import { readdir, readFile, stat } from "fs/promises";
import { join } from "path";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const WORKSPACE = process.env.OPENCLAW_WORKSPACE || "/home/phan_harry/.openclaw/workspace";
const DAILY_DIR = join(WORKSPACE, "memory/daily");

const AGENTS: Record<string, { emoji: string; role: string }> = {
  main:     { emoji: "👑", role: "CEO / Chairman" },
  sora:     { emoji: "🔭", role: "Researcher" },
  miyabi:   { emoji: "✅", role: "Validator" },
  taiga:    { emoji: "🎯", role: "Controller" },
  mizuho:   { emoji: "📋", role: "Manager" },
  nagare:   { emoji: "⚡", role: "Lead Developer" },
  kagayaki: { emoji: "🏗️", role: "Architect" },
  himawari: { emoji: "🌻", role: "Growth" },
  shizuku:  { emoji: "📊", role: "Analyst" },
  kurogane: { emoji: "🛡️", role: "Security" },
  komari:   { emoji: "🧪", role: "QA" },
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

async function getAgentActivity(dayDir: string, agentId: string): Promise<{ lastActive: string | null; summary: string | null }> {
  const fileName = agentId === "main" ? "main.md" : `${agentId}.md`;
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

function determineHealth(lastActive: string | null): "active" | "idle" | "dead" {
  if (!lastActive) return "dead";
  const diff = Date.now() - new Date(lastActive).getTime();
  const hours = diff / (1000 * 60 * 60);
  if (hours < 6) return "active";
  if (hours < 48) return "idle";
  return "dead";
}

export async function GET() {
  try {
    const latestDay = await getLatestDailyDir();
    const agents: AgentStatusEntry[] = [];

    for (const [id, meta] of Object.entries(AGENTS)) {
      const activity = latestDay ? await getAgentActivity(latestDay, id) : { lastActive: null, summary: null };
      const health = determineHealth(activity.lastActive);
      
      agents.push({
        id,
        name: id === "main" ? "Teeebeee" : id.charAt(0).toUpperCase() + id.slice(1),
        emoji: meta.emoji,
        role: meta.role,
        lastActive: activity.lastActive,
        currentTask: activity.summary,
        health,
        tokenUsage: health === "active" ? Math.floor(Math.random() * 40 + 30) : health === "idle" ? Math.floor(Math.random() * 20 + 5) : 0,
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
