import { NextResponse } from "next/server";
import { readdir, readFile } from "fs/promises";
import { join } from "path";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const WORKSPACE = process.env.OPENCLAW_WORKSPACE || "/home/phan_harry/.openclaw/workspace";
const REPORTS_DIR = join(WORKSPACE, "memory/consistency-reports");
const DAILY_DIR = join(WORKSPACE, "memory/daily");

interface MemoryHealthData {
  latestScan: any | null;
  sevenDayReport: any | null;
  agentActivity: Record<string, { hasFile: boolean; dayDir: string }[]>;
  monitorLog: string[];
}

async function readJsonSafe(path: string): Promise<any | null> {
  try {
    const content = await readFile(path, "utf-8");
    return JSON.parse(content);
  } catch {
    return null;
  }
}

async function getMonitorLogTail(lines: number = 30): Promise<string[]> {
  try {
    const content = await readFile(join(REPORTS_DIR, "monitor.log"), "utf-8");
    return content.split("\n").filter(l => l.trim()).slice(-lines);
  } catch {
    return [];
  }
}

async function getAgentDailyActivity(): Promise<Record<string, { hasFile: boolean; dayDir: string }[]>> {
  const agents = ["sora", "miyabi", "taiga", "nagare", "kagayaki", "himawari", "kurogane", "komari", "shizuku", "mizuho", "main"];
  const activity: Record<string, { hasFile: boolean; dayDir: string }[]> = {};

  try {
    const dirs = await readdir(DAILY_DIR);
    const sorted = dirs.filter(d => /^\d{4}-\d{2}-\d{2}$/.test(d)).sort().reverse().slice(0, 7);

    for (const agent of agents) {
      activity[agent] = [];
      for (const day of sorted) {
        const fileName = agent === "main" ? "main.md" : `${agent}.md`;
        try {
          await readFile(join(DAILY_DIR, day, fileName), "utf-8");
          activity[agent].push({ hasFile: true, dayDir: day });
        } catch {
          activity[agent].push({ hasFile: false, dayDir: day });
        }
      }
    }
  } catch {
    // daily dir doesn't exist
  }

  return activity;
}

async function getSevenDayReport(): Promise<any | null> {
  try {
    const files = await readdir(REPORTS_DIR);
    const sevenDayFiles = files.filter(f => f.startsWith("7day_") && f.endsWith(".json")).sort().reverse();
    if (sevenDayFiles.length === 0) return null;
    return await readJsonSafe(join(REPORTS_DIR, sevenDayFiles[0]));
  } catch {
    return null;
  }
}

export async function GET() {
  try {
    const [latestScan, sevenDayReport, agentActivity, monitorLog] = await Promise.all([
      readJsonSafe(join(REPORTS_DIR, "latest_scan.json")),
      getSevenDayReport(),
      getAgentDailyActivity(),
      getMonitorLogTail(),
    ]);

    const data: MemoryHealthData = {
      latestScan,
      sevenDayReport,
      agentActivity,
      monitorLog,
    };

    return NextResponse.json({ data }, {
      headers: { "Cache-Control": "no-cache, no-store, must-revalidate" },
    });
  } catch (error) {
    console.error("[API] /api/memory-health error:", error);
    return NextResponse.json({ data: null, error: "Failed to read memory health" }, { status: 500 });
  }
}
