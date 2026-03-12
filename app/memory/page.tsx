"use client";

import { useState, useEffect } from "react";

interface MemoryHealthData {
  latestScan: {
    timestamp: string;
    scan_type: string;
    files_scanned: number;
    total_memory_size: number;
    issues_found: number;
    issues: Array<{
      type: string;
      severity: string;
      agent: string;
      description: string;
    }>;
  } | null;
  sevenDayReport: {
    timestamp: string;
    analysis: {
      period: string;
      total_scans: number;
      average_files_scanned: number;
      memory_growth: {
        start_size: number;
        end_size: number;
        total_growth_bytes: number;
        growth_rate_percent: number;
        daily_average: number;
      };
      issue_trends: {
        total_issues_7days: number;
        average_issues_per_scan: number;
        issue_types: Record<string, number>;
        most_common_issue: string;
      };
      agent_activity: {
        agent_stats: Record<string, { total_files: number; average_files: number; active_days: number }>;
      };
      recommendations: Array<{ priority: string; action: string; description: string }>;
    };
  } | null;
  agentActivity: Record<string, Array<{ hasFile: boolean; dayDir: string }>>;
  monitorLog: string[];
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function BarChart({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <div style={{ flex: 1, height: 6, background: "var(--bg-4)", borderRadius: 3, overflow: "hidden" }}>
        <div style={{ width: `${pct}%`, height: "100%", background: color, borderRadius: 3, transition: "width 0.3s" }} />
      </div>
      <span className="mono t-xs" style={{ color: "var(--text-3)", minWidth: 40, textAlign: "right" }}>{value}</span>
    </div>
  );
}

function HeatmapCell({ active }: { active: boolean }) {
  return (
    <div
      style={{
        width: 14,
        height: 14,
        borderRadius: 3,
        background: active ? "var(--green)" : "var(--bg-4)",
        opacity: active ? 0.9 : 0.3,
        transition: "opacity 0.15s",
      }}
      title={active ? "Active" : "No activity"}
    />
  );
}

export default function MemoryPage() {
  const [data, setData] = useState<MemoryHealthData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetch_data() {
      try {
        const res = await fetch(`/api/memory-health?t=${Date.now()}`, { cache: "no-store" });
        const json = await res.json();
        setData(json.data);
      } catch (err) {
        console.error("Failed to fetch memory health:", err);
      } finally {
        setLoading(false);
      }
    }
    fetch_data();
  }, []);

  if (loading) {
    return (
      <>
        <div className="page-head"><h1>Memory Health</h1></div>
        <div className="empty">Loading memory health data...</div>
      </>
    );
  }

  if (!data) {
    return (
      <>
        <div className="page-head"><h1>Memory Health</h1></div>
        <div className="empty">No memory health data available</div>
      </>
    );
  }

  const scan = data.latestScan;
  const report = data.sevenDayReport;
  const growth = report?.analysis?.memory_growth;
  const issueTrends = report?.analysis?.issue_trends;
  const agentStats = report?.analysis?.agent_activity?.agent_stats || {};
  const recommendations = report?.analysis?.recommendations || [];

  const agentNames: Record<string, string> = {
    main: "Teeebeee", sora: "Sora", miyabi: "Miyabi", taiga: "Taiga",
    mizuho: "Mizuho", nagare: "Nagare", kagayaki: "Kagayaki",
    himawari: "Himawari", shizuku: "Shizuku", kurogane: "Kurogane", komari: "Komari",
  };

  return (
    <>
      <div className="page-head">
        <h1>Memory Health</h1>
        <div className="live-pill">
          <span className="live-dot" />
          {scan ? `${scan.files_scanned} files · ${scan.issues_found} issues` : "No scan data"}
        </div>
      </div>

      {/* Stats row */}
      <div className="g" style={{ marginBottom: 24 }}>
        <div className="panel g3">
          <div className="stat-label">Total Memory</div>
          <div className="stat-num">{scan ? formatBytes(scan.total_memory_size) : "—"}</div>
        </div>
        <div className="panel g3">
          <div className="stat-label">Files Scanned</div>
          <div className="stat-num">{scan?.files_scanned ?? "—"}</div>
        </div>
        <div className="panel g3">
          <div className="stat-label">Issues Found</div>
          <div className="stat-num" style={{ color: scan && scan.issues_found > 0 ? "var(--amber)" : "var(--green)" }}>
            {scan?.issues_found ?? "—"}
          </div>
        </div>
        <div className="panel g3">
          <div className="stat-label">7-Day Growth</div>
          <div className="stat-num" style={{ color: growth && growth.growth_rate_percent > 0 ? "var(--green)" : "var(--amber)" }}>
            {growth ? `${growth.growth_rate_percent > 0 ? "+" : ""}${growth.growth_rate_percent.toFixed(1)}%` : "—"}
          </div>
          {growth && <div className="stat-sub">{formatBytes(Math.abs(growth.total_growth_bytes))} {growth.total_growth_bytes > 0 ? "added" : "reduced"}</div>}
        </div>
      </div>

      <div className="g">
        {/* Memory Growth Trend */}
        {growth && (
          <div className="panel g6">
            <div className="panel-head">
              <span className="panel-title">Memory Growth Trend (7-day)</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div>
                <div className="t-xs mono t-dim" style={{ marginBottom: 4 }}>Start Size</div>
                <BarChart value={growth.start_size} max={Math.max(growth.start_size, growth.end_size) * 1.1} color="var(--blue)" />
                <div className="t-xs t-dim" style={{ marginTop: 2 }}>{formatBytes(growth.start_size)}</div>
              </div>
              <div>
                <div className="t-xs mono t-dim" style={{ marginBottom: 4 }}>End Size</div>
                <BarChart value={growth.end_size} max={Math.max(growth.start_size, growth.end_size) * 1.1} color={growth.end_size > growth.start_size ? "var(--amber)" : "var(--green)"} />
                <div className="t-xs t-dim" style={{ marginTop: 2 }}>{formatBytes(growth.end_size)}</div>
              </div>
              <div style={{ borderTop: "1px solid var(--border-1)", paddingTop: 10 }}>
                <div className="t-xs mono t-dim">Daily Average</div>
                <div className="mono" style={{ fontSize: 14, color: growth.daily_average > 0 ? "var(--amber)" : "var(--green)" }}>
                  {growth.daily_average > 0 ? "+" : ""}{formatBytes(Math.abs(growth.daily_average))}/day
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Issue Trends */}
        {issueTrends && (
          <div className="panel g6">
            <div className="panel-head">
              <span className="panel-title">Issue Trends (7-day)</span>
              <span className="panel-count">{issueTrends.total_issues_7days} total</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <div className="row">
                <div className="row-left">
                  <span className="row-name">Avg Issues per Scan</span>
                </div>
                <span className="mono t-sm" style={{ color: "var(--text-2)" }}>{issueTrends.average_issues_per_scan.toFixed(1)}</span>
              </div>
              <div className="row">
                <div className="row-left">
                  <span className="row-name">Most Common Issue</span>
                </div>
                <span className="tag tag-stalled">{issueTrends.most_common_issue?.replace(/_/g, " ") || "—"}</span>
              </div>
              {Object.entries(issueTrends.issue_types || {}).map(([type, count]) => (
                <div key={type} className="row">
                  <div className="row-left">
                    <span className="row-sub">{type.replace(/_/g, " ")}</span>
                  </div>
                  <span className="mono t-xs" style={{ color: "var(--text-3)" }}>{count}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Agent Activity Heatmap */}
        <div className="panel g12">
          <div className="panel-head">
            <span className="panel-title">Agent Daily File Activity</span>
            <span className="panel-count">Last 7 days</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {/* Header row */}
            <div className="f fi" style={{ gap: 6, paddingLeft: 90 }}>
              {(data.agentActivity[Object.keys(data.agentActivity)[0]] || []).map((d, i) => (
                <div key={i} className="mono t-xs t-dim" style={{ width: 14, textAlign: "center", fontSize: 9 }}>
                  {d.dayDir.slice(-2)}
                </div>
              ))}
            </div>
            {/* Agent rows */}
            {Object.entries(data.agentActivity).map(([agent, days]) => (
              <div key={agent} className="f fi" style={{ gap: 6 }}>
                <span className="mono t-xs" style={{ width: 84, color: "var(--text-3)", textAlign: "right", paddingRight: 8 }}>
                  {agentNames[agent] || agent}
                </span>
                {days.map((d, i) => (
                  <HeatmapCell key={i} active={d.hasFile} />
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* File Integrity */}
        {scan && scan.issues.length > 0 && (
          <div className="panel g6">
            <div className="panel-head">
              <span className="panel-title">File Integrity Issues</span>
              <span className="panel-count">{scan.issues.length}</span>
            </div>
            {scan.issues.slice(0, 15).map((issue, i) => (
              <div key={i} className="row">
                <div className="row-left">
                  <span className="row-name" style={{ fontSize: 12 }}>{issue.description}</span>
                  <span className="row-sub">{issue.agent}</span>
                </div>
                <span className={`tag ${issue.severity === "HIGH" ? "tag-failed" : issue.severity === "MEDIUM" ? "tag-stalled" : "tag-delayed"}`}>
                  {issue.severity}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Recommendations */}
        {recommendations.length > 0 && (
          <div className="panel g6">
            <div className="panel-head">
              <span className="panel-title">Recommendations</span>
            </div>
            {recommendations.map((rec, i) => (
              <div key={i} className="row">
                <div className="row-left">
                  <span className="row-name" style={{ fontSize: 12 }}>{rec.description}</span>
                  <span className="row-sub">{rec.action.replace(/_/g, " ")}</span>
                </div>
                <span className={`tag ${rec.priority === "HIGH" ? "tag-failed" : "tag-delayed"}`}>{rec.priority}</span>
              </div>
            ))}
          </div>
        )}

        {/* Monitor Log */}
        <div className="panel g12">
          <div className="panel-head">
            <span className="panel-title">Monitor Log</span>
            <span className="panel-count">{data.monitorLog.length} lines</span>
          </div>
          <div style={{
            background: "var(--bg-0)",
            borderRadius: "var(--r-sm)",
            padding: 14,
            maxHeight: 300,
            overflow: "auto",
            fontFamily: "var(--font-mono)",
            fontSize: 11,
            lineHeight: 1.7,
          }}>
            {data.monitorLog.length === 0 ? (
              <span className="t-dim">No log entries</span>
            ) : (
              data.monitorLog.map((line, i) => (
                <div key={i} style={{
                  color: line.includes("[ERROR]") ? "var(--red)" :
                    line.includes("[WARN]") ? "var(--amber)" :
                      line.includes("[INFO]") ? "var(--text-3)" : "var(--text-4)",
                }}>
                  {line}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </>
  );
}
