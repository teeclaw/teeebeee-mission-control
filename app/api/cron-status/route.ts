import { NextResponse } from "next/server";
import { readFile } from "fs/promises";
import { join } from "path";
import { exec as execCb } from "child_process";
import { promisify } from "util";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const execAsync = promisify(execCb);
const WORKSPACE = process.env.OPENCLAW_WORKSPACE || "/home/phan_harry/.openclaw/workspace";

interface CronEntry {
  id: string;
  name: string;
  schedule: string;
  scheduleHuman: string;
  logFile: string;
  logTail: string[];
  status: "ok" | "error" | "unknown";
  lastLine: string | null;
}

const CRON_DEFS: Array<{ id: string; name: string; schedule: string; scheduleHuman: string; logFile: string }> = [
  {
    id: "pipeline-cron",
    name: "Pipeline Scanner",
    schedule: "0 0 * * *",
    scheduleHuman: "Daily at midnight UTC",
    logFile: "memory/pipeline-cron.log",
  },
  {
    id: "memory-monitor",
    name: "Memory Consistency Monitor",
    schedule: "0 */4 * * *",
    scheduleHuman: "Every 4 hours",
    logFile: "memory/consistency-reports/monitor.log",
  },
  {
    id: "gateway-restart",
    name: "Gateway Restart",
    schedule: "0 6 * * *",
    scheduleHuman: "Daily at 06:00 UTC",
    logFile: "memory/gateway-restart.log",
  },
];

async function readLogTail(relPath: string, lines: number = 10): Promise<{ tail: string[]; status: "ok" | "error" | "unknown" }> {
  const fullPath = join(WORKSPACE, relPath);
  try {
    const content = await readFile(fullPath, "utf-8");
    const allLines = content.split("\n").filter(l => l.trim());
    const tail = allLines.slice(-lines);
    const hasError = tail.some(l => l.includes("[ERROR]") || l.includes("[FAIL]"));
    return { tail, status: hasError ? "error" : "ok" };
  } catch {
    return { tail: [], status: "unknown" };
  }
}

export async function GET() {
  try {
    const entries: CronEntry[] = [];

    for (const def of CRON_DEFS) {
      const { tail, status } = await readLogTail(def.logFile);
      entries.push({
        id: def.id,
        name: def.name,
        schedule: def.schedule,
        scheduleHuman: def.scheduleHuman,
        logFile: def.logFile,
        logTail: tail,
        status,
        lastLine: tail.length > 0 ? tail[tail.length - 1] : null,
      });
    }

    return NextResponse.json({ data: entries }, {
      headers: { "Cache-Control": "no-cache, no-store, must-revalidate" },
    });
  } catch (error) {
    console.error("[API] /api/cron-status error:", error);
    return NextResponse.json({ data: [], error: "Failed to read cron status" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { cronId } = await req.json();
    const def = CRON_DEFS.find(d => d.id === cronId);
    if (!def) return NextResponse.json({ error: "Unknown cron job" }, { status: 400 });

    // Execute the cron command based on id
    let command = "";
    switch (cronId) {
      case "pipeline-cron":
        command = `cd ${WORKSPACE} && bash memory/pipeline-cron.sh >> ${join(WORKSPACE, def.logFile)} 2>&1 &`;
        break;
      case "memory-monitor":
        command = `cd ${WORKSPACE} && python3 memory/consistency-reports/monitor.py >> ${join(WORKSPACE, def.logFile)} 2>&1 &`;
        break;
      case "gateway-restart":
        command = `openclaw gateway restart >> ${join(WORKSPACE, def.logFile)} 2>&1 &`;
        break;
      default:
        return NextResponse.json({ error: "No command defined" }, { status: 400 });
    }

    try {
      await execAsync(command, { timeout: 5000 });
    } catch {
      // Background process — may not return cleanly
    }

    return NextResponse.json({ ok: true, triggered: cronId });
  } catch (error) {
    console.error("[API] /api/cron-status POST error:", error);
    return NextResponse.json({ error: "Failed to trigger cron" }, { status: 500 });
  }
}
