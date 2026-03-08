"use client";

import { useEffect, useMemo, useState } from "react";
import type { AgentDetail, OrgEdge, OrgNode } from "@/lib/types";
import { createClient } from "@supabase/supabase-js";

type StatusFilter = "all" | "running" | "idle" | "blocked" | "error" | "offline";

export default function OrgChartClient() {
  const [nodes, setNodes] = useState<OrgNode[]>([]);
  const [edges, setEdges] = useState<OrgEdge[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<string | null>(null);
  const [detail, setDetail] = useState<AgentDetail | null>(null);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [blockersOnly, setBlockersOnly] = useState(false);
  const [scale, setScale] = useState(1);
  const [collapsedTeams, setCollapsedTeams] = useState<string[]>([]);

  const supabase = useMemo(() => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !key) return null;
    return createClient(url, key);
  }, []);

  async function fetchGraph() {
    const res = await fetch(`/api/orgchart?t=${Date.now()}`, { cache: "no-store" });
    const json = await res.json();
    const graph = json?.data || { nodes: [], edges: [] };
    setNodes(graph.nodes || []);
    setEdges(graph.edges || []);
  }

  useEffect(() => {
    (async () => {
      try {
        await fetchGraph();
      } finally {
        setLoading(false);
      }
    })();

    const timer = setInterval(() => {
      fetchGraph().catch(() => null);
    }, 15000);

    let channel: any;
    if (supabase) {
      channel = supabase
        .channel("orgchart-live")
        .on("postgres_changes", { event: "*", schema: "public", table: "org_nodes" }, () => {
          fetchGraph().catch(() => null);
        })
        .on("postgres_changes", { event: "*", schema: "public", table: "org_edges" }, () => {
          fetchGraph().catch(() => null);
        })
        .on("postgres_changes", { event: "*", schema: "public", table: "agent_blockers" }, () => {
          fetchGraph().catch(() => null);
        })
        .subscribe();
    }

    return () => {
      clearInterval(timer);
      if (channel && supabase) supabase.removeChannel(channel);
    };
  }, [supabase]);

  useEffect(() => {
    if (!selected) return;
    (async () => {
      const res = await fetch(`/api/agents/${selected}?t=${Date.now()}`, { cache: "no-store" });
      const json = await res.json();
      setDetail(json?.data || null);
    })();
  }, [selected]);

  const blockerIds = useMemo(() => new Set((detail?.blockers || []).map((b) => b.agentId)), [detail]);

  const filtered = useMemo(() => {
    return nodes.filter((n) => {
      const s = `${n.name} ${n.agentId} ${n.role} ${n.team}`.toLowerCase();
      const searchOk = !search.trim() || s.includes(search.toLowerCase());
      const statusOk = status === "all" || n.status === status;
      const blockerOk = !blockersOnly || blockerIds.has(n.agentId) || n.status === "blocked" || n.status === "error";
      const teamOk = !collapsedTeams.includes(n.team);
      return searchOk && statusOk && blockerOk && teamOk;
    });
  }, [nodes, search, status, blockersOnly, blockerIds, collapsedTeams]);

  const teams = useMemo(() => Array.from(new Set(nodes.map((n) => n.team))).sort(), [nodes]);

  const byLevel = useMemo(() => {
    const m = new Map<number, OrgNode[]>();
    for (const n of filtered) {
      if (!m.has(n.level)) m.set(n.level, []);
      m.get(n.level)!.push(n);
    }
    return [...m.entries()].sort((a, b) => a[0] - b[0]);
  }, [filtered]);

  const severity = (st: string) => (st === "running" ? "tag-healthy" : st === "idle" ? "tag-delayed" : "tag-failed");

  return (
    <>
      <div className="page-head">
        <h1>Agents OrgChart</h1>
        <div className="live-pill"><span className="live-dot" /> LIVE · {nodes.length} nodes · {edges.length} edges</div>
      </div>

      <section className="g">
        <article className="panel g12">
          <div className="org-toolbar">
            <input className="input" placeholder="Search agent / role / team" value={search} onChange={(e) => setSearch(e.target.value)} />
            <select className="select" value={status} onChange={(e) => setStatus(e.target.value as StatusFilter)}>
              <option value="all">All status</option>
              <option value="running">Running</option>
              <option value="idle">Idle</option>
              <option value="blocked">Blocked</option>
              <option value="error">Error</option>
              <option value="offline">Offline</option>
            </select>
            <button className={`btn ${blockersOnly ? "btn-danger" : "btn-ghost"}`} onClick={() => setBlockersOnly((v) => !v)}>Blockers only</button>
            <div className="f fi fw" style={{ gap: 6 }}>
              {teams.map((t) => {
                const collapsed = collapsedTeams.includes(t);
                return (
                  <button
                    key={t}
                    className={`btn ${collapsed ? "btn-ghost" : "btn-primary"}`}
                    onClick={() =>
                      setCollapsedTeams((prev) =>
                        prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]
                      )
                    }
                  >
                    {collapsed ? `Show ${t}` : `Hide ${t}`}
                  </button>
                );
              })}
            </div>
            <div className="zoom-wrap">
              <button className="btn btn-ghost" onClick={() => setScale((s) => Math.max(0.7, +(s - 0.1).toFixed(2)))}>-</button>
              <span className="zoom-num">{Math.round(scale * 100)}%</span>
              <button className="btn btn-ghost" onClick={() => setScale((s) => Math.min(1.6, +(s + 0.1).toFixed(2)))}>+</button>
            </div>
          </div>

          {loading ? <div className="empty">Loading orgchart...</div> : null}
          {!loading && filtered.length === 0 ? <div className="empty">NO_DATA: no nodes match filters</div> : null}

          <div className="row" style={{ marginBottom: 10 }}>
            <span className="row-name">Reporting links</span>
            <span className="row-sub">{edges.length} edges (solid/dotted)</span>
          </div>

          {edges.length > 0 && (
            <div className="connector-list">
              {edges.slice(0, 20).map((e) => (
                <div key={e.id} className="connector-row">
                  <span className="connector-agent">{e.fromAgentId}</span>
                  <span className={`connector-line ${e.relationType === "dotted" ? "is-dotted" : "is-solid"}`} />
                  <span className="connector-agent">{e.toAgentId}</span>
                </div>
              ))}
            </div>
          )}

          <div className="org-canvas-wrap">
            <div className="org-canvas" style={{ transform: `scale(${scale})` }}>
              {byLevel.map(([level, arr]) => (
                <div key={level} className="org-level">
                  <div className="org-level-label">Level {level}</div>
                  <div className="agent-grid">
                    {arr.map((n) => (
                      <button key={n.agentId} className={`agent-card org-node-btn ${selected === n.agentId ? "org-node-active" : ""}`} onClick={() => setSelected(n.agentId)}>
                        <div className="f fi fj">
                          <div>
                            <div className="agent-name">{n.name}</div>
                            <div className="agent-id">{n.agentId}</div>
                            <div className="agent-model">{n.role} · {n.team}</div>
                          </div>
                          <span className={`tag ${severity(n.status)}`}>{n.status}</span>
                        </div>
                        <div className="agent-meta">Primary: {n.modelPrimary || "unknown"}</div>
                        <div className="agent-meta">Fallback: {n.modelFallback || "none"}</div>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </article>
      </section>

      {selected && (
        <aside className="org-drawer">
          <div className="panel-head">
            <span className="panel-title">Agent Detail</span>
            <button className="btn btn-ghost" onClick={() => { setSelected(null); setDetail(null); }}>Close</button>
          </div>

          {!detail ? <div className="empty">Loading detail...</div> : (
            <>
              <div className="agent-name" style={{ marginBottom: 8 }}>{detail.node.name}</div>
              <div className="agent-id">{detail.node.agentId}</div>
              <div className="agent-meta">{detail.node.role} · {detail.node.team}</div>
              <div className="agent-meta">Primary: {detail.node.modelPrimary || "unknown"}</div>
              <div className="agent-meta">Fallback: {detail.node.modelFallback || "none"}</div>

              <div className="panel-head" style={{ marginTop: 16, marginBottom: 8 }}>
                <span className="panel-title">Current Task</span>
              </div>
              <div className="agent-meta">{detail.currentTask?.title || "No active task"}</div>

              <div className="panel-head" style={{ marginTop: 16, marginBottom: 8 }}>
                <span className="panel-title">Metrics 7d</span>
              </div>
              <div className="agent-meta">Throughput: {detail.metrics7d?.throughput ?? 0}</div>
              <div className="agent-meta">Error rate: {detail.metrics7d?.errorRate ?? 0}%</div>
              <div className="agent-meta">Retries: {detail.metrics7d?.retries ?? 0}</div>

              <div className="panel-head" style={{ marginTop: 16, marginBottom: 8 }}>
                <span className="panel-title">Blockers</span>
                <span className="panel-count">{detail.blockers.length}</span>
              </div>
              {detail.blockers.length === 0 ? <div className="empty">No active blockers</div> : detail.blockers.map((b) => (
                <div key={b.id} className="row">
                  <div className="row-left">
                    <span className="row-name">{b.title}</span>
                    <span className="row-sub">{b.severity}</span>
                  </div>
                </div>
              ))}
            </>
          )}
        </aside>
      )}
    </>
  );
}
