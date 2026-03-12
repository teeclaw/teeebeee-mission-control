"use client";

import { useState, useEffect } from "react";

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

function StatusBadge({ status }: { status: CronEntry["status"] }) {
  const cls = status === "ok" ? "tag-healthy" : status === "error" ? "tag-failed" : "tag-pending";
  const label = status === "ok" ? "OK" : status === "error" ? "ERROR" : "UNKNOWN";
  return <span className={`tag ${cls}`}>{label}</span>;
}

export default function CronMonitor() {
  const [crons, setCrons] = useState<CronEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [triggering, setTriggering] = useState<string | null>(null);

  async function fetchCrons() {
    try {
      const res = await fetch(`/api/cron-status?t=${Date.now()}`, { cache: "no-store" });
      const json = await res.json();
      setCrons(json.data || []);
    } catch (err) {
      console.error("Failed to fetch cron status:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchCrons();
    const interval = setInterval(fetchCrons, 30000);
    return () => clearInterval(interval);
  }, []);

  async function triggerCron(cronId: string) {
    setTriggering(cronId);
    try {
      const res = await fetch("/api/cron-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cronId }),
      });
      const json = await res.json();
      if (json.ok) {
        // Wait a bit and refresh
        setTimeout(fetchCrons, 2000);
      }
    } catch (err) {
      console.error("Failed to trigger cron:", err);
    } finally {
      setTriggering(null);
    }
  }

  if (loading) return <div className="empty">Loading cron status...</div>;

  const okCount = crons.filter(c => c.status === "ok").length;
  const errorCount = crons.filter(c => c.status === "error").length;

  return (
    <>
      {/* Summary */}
      <div className="g" style={{ marginBottom: 24 }}>
        <div className="panel g4">
          <div className="stat-label">Total Jobs</div>
          <div className="stat-num">{crons.length}</div>
        </div>
        <div className="panel g4">
          <div className="stat-label">Healthy</div>
          <div className="stat-num green">{okCount}</div>
        </div>
        <div className="panel g4">
          <div className="stat-label">Errors</div>
          <div className="stat-num" style={{ color: errorCount > 0 ? "var(--red)" : "var(--green)" }}>{errorCount}</div>
        </div>
      </div>

      {/* Cron job cards */}
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {crons.map(cron => (
          <div key={cron.id} className="panel">
            <div className="f fi fj" style={{ marginBottom: expanded === cron.id ? 16 : 0 }}>
              <div className="f fi" style={{ gap: 12 }}>
                <StatusBadge status={cron.status} />
                <div>
                  <div className="row-name" style={{ fontSize: 15 }}>{cron.name}</div>
                  <div className="mono t-xs t-dim" style={{ marginTop: 2 }}>
                    {cron.scheduleHuman} · <code>{cron.schedule}</code>
                  </div>
                </div>
              </div>
              <div className="f fi" style={{ gap: 8 }}>
                <button
                  className="btn btn-ghost"
                  onClick={() => setExpanded(expanded === cron.id ? null : cron.id)}
                >
                  {expanded === cron.id ? "▲ Hide" : "▼ Logs"}
                </button>
                <button
                  className="btn btn-primary"
                  disabled={triggering === cron.id}
                  onClick={() => triggerCron(cron.id)}
                >
                  {triggering === cron.id ? "Running..." : "▶ Trigger"}
                </button>
              </div>
            </div>

            {/* Last log line preview */}
            {expanded !== cron.id && cron.lastLine && (
              <div className="mono t-xs" style={{
                marginTop: 8,
                color: cron.lastLine.includes("[ERROR]") ? "var(--red)" : "var(--text-4)",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}>
                {cron.lastLine}
              </div>
            )}

            {/* Expanded log viewer */}
            {expanded === cron.id && (
              <div style={{
                background: "var(--bg-0)",
                borderRadius: "var(--r-sm)",
                padding: 14,
                maxHeight: 280,
                overflow: "auto",
                fontFamily: "var(--font-mono)",
                fontSize: 11,
                lineHeight: 1.7,
              }}>
                {cron.logTail.length === 0 ? (
                  <span className="t-dim">No log entries found at {cron.logFile}</span>
                ) : (
                  cron.logTail.map((line, i) => (
                    <div key={i} style={{
                      color: line.includes("[ERROR]") || line.includes("[FAIL]") ? "var(--red)" :
                        line.includes("[WARN]") ? "var(--amber)" :
                          line.includes("[START]") || line.includes("✅") ? "var(--green)" :
                            "var(--text-3)",
                    }}>
                      {line}
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        ))}

        {crons.length === 0 && <div className="empty">No cron jobs configured</div>}
      </div>
    </>
  );
}
