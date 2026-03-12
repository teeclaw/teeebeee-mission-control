"use client";

import { useState, useEffect } from "react";

interface AgentStatus {
  id: string;
  name: string;
  emoji: string;
  role: string;
  lastActive: string | null;
  currentTask: string | null;
  health: "active" | "idle" | "dead";
  tokenUsage: number;
}

function HealthDot({ health }: { health: AgentStatus["health"] }) {
  const cls = health === "active" ? "dot-green" : health === "idle" ? "dot-amber" : "dot-red";
  const label = health === "active" ? "🟢" : health === "idle" ? "🟡" : "🔴";
  return <span className={`health-dot ${cls}`} title={label} />;
}

function TokenBar({ pct }: { pct: number }) {
  const c = pct >= 70 ? "var(--amber)" : pct >= 40 ? "var(--green)" : "var(--text-4)";
  return (
    <div className="conf-wrap">
      <div className="conf-bar" style={{ width: 48 }}>
        <div className="conf-fill" style={{ width: `${pct}%`, background: c }} />
      </div>
      <span className="conf-num">{pct}%</span>
    </div>
  );
}

function timeAgo(iso: string | null): string {
  if (!iso) return "Never";
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return "Just now";
  if (min < 60) return `${min}m ago`;
  const hrs = Math.floor(min / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export default function AgentStatusPanel() {
  const [agents, setAgents] = useState<AgentStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  async function fetchStatus() {
    try {
      const res = await fetch(`/api/agent-status?t=${Date.now()}`, { cache: "no-store" });
      const json = await res.json();
      setAgents(json.data || []);
      setLastRefresh(new Date());
    } catch (err) {
      console.error("Failed to fetch agent status:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) return <div className="empty">Loading agent status...</div>;

  const activeCount = agents.filter(a => a.health === "active").length;
  const idleCount = agents.filter(a => a.health === "idle").length;
  const deadCount = agents.filter(a => a.health === "dead").length;

  return (
    <>
      {/* Summary stats */}
      <div className="g" style={{ marginBottom: 24 }}>
        <div className="panel g4">
          <div className="stat-label">Active</div>
          <div className="stat-num green">{activeCount}</div>
        </div>
        <div className="panel g4">
          <div className="stat-label">Idle</div>
          <div className="stat-num amber">{idleCount}</div>
        </div>
        <div className="panel g4">
          <div className="stat-label">Dead</div>
          <div className="stat-num red">{deadCount}</div>
        </div>
      </div>

      {/* Auto-refresh indicator */}
      <div className="f fi fj" style={{ marginBottom: 16 }}>
        <div className="live-pill">
          <span className="live-dot" />
          Auto-refresh 30s · Last: {lastRefresh.toLocaleTimeString()}
        </div>
        <button className="btn btn-ghost" onClick={fetchStatus}>↻ Refresh</button>
      </div>

      {/* Agent grid */}
      <div className="agent-grid">
        {agents.map(agent => (
          <div key={agent.id} className="agent-card">
            <div className="f fi fj">
              <div className="f fi" style={{ gap: 10 }}>
                <span style={{ fontSize: 20 }}>{agent.emoji}</span>
                <div>
                  <div className="agent-name">{agent.name}</div>
                  <div className="agent-id">{agent.role}</div>
                </div>
              </div>
              <HealthDot health={agent.health} />
            </div>

            <div className="agent-meta">
              <div className="f fi fj">
                <span>Last active</span>
                <span style={{ color: "var(--text-2)" }}>{timeAgo(agent.lastActive)}</span>
              </div>
            </div>

            {agent.currentTask && (
              <div className="agent-meta" style={{ borderTop: "none", marginTop: 4, paddingTop: 0 }}>
                <div style={{ color: "var(--text-3)", fontSize: 11 }}>
                  📝 {agent.currentTask}
                </div>
              </div>
            )}

            <div className="agent-meta" style={{ borderTop: agent.currentTask ? "none" : undefined, marginTop: agent.currentTask ? 4 : undefined, paddingTop: agent.currentTask ? 0 : undefined }}>
              <div className="f fi fj">
                <span>Token usage</span>
                <TokenBar pct={agent.tokenUsage} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
