"use client";

import { useState } from "react";
import Link from "next/link";
import type { OpportunityStage, Decision, Opportunity } from "@/lib/types";

const stages: OpportunityStage[] = ["signal", "thesis", "validation", "build", "launch"];

const stageColors: Record<OpportunityStage, string> = {
  signal: "var(--text-3)",
  thesis: "var(--blue)",
  validation: "var(--amber)",
  build: "var(--green)",
  launch: "var(--green)",
};

const stageEmoji: Record<OpportunityStage, string> = {
  signal: "📡",
  thesis: "📝",
  validation: "✅",
  build: "🔨",
  launch: "🚀",
};

const agentEmoji: Record<string, string> = {
  Miyabi: "✅", Sora: "🔭", Taiga: "🎯", Mizuho: "📋",
  Nagare: "⚡", Himawari: "🌻", Shizuku: "📊", Kurogane: "🛡️",
  Komari: "🧪", Kagayaki: "🏗️", Teeebeee: "👑",
};

type PipelineItem = Opportunity & { role?: string; decision?: Decision | null };

function ConfBar({ v }: { v: number }) {
  const c = v >= 80 ? "var(--green)" : v >= 60 ? "var(--amber)" : "var(--red)";
  return (
    <div className="conf-wrap">
      <div className="conf-bar"><div className="conf-fill" style={{ width: `${v}%`, background: c }} /></div>
      <span className="conf-num">{v}%</span>
    </div>
  );
}

function DecisionTag({ decision }: { decision: Decision | null | undefined }) {
  if (!decision) return <span className="tag tag-pending">Pending</span>;
  const styles: Record<string, { className: string; text: string }> = {
    GO: { className: "tag tag-go", text: "GO" },
    CONDITIONAL_GO: { className: "tag tag-conditional", text: "CONDITIONAL" },
    NO_GO: { className: "tag tag-no-go", text: "NO-GO" },
  };
  const style = styles[decision];
  return <span className={style.className}>{style.text}</span>;
}

function KanbanCard({ item, onClick }: { item: PipelineItem; onClick: () => void }) {
  // Mock "days in stage" since created_at isn't exposed — use a hash-based value
  const daysSeed = item.id.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  const daysInStage = (daysSeed % 7) + 1;
  const isStalled = daysInStage > 3;
  const emoji = agentEmoji[item.owner] || "🤖";

  return (
    <button className="kanban-card" onClick={onClick} style={{ cursor: "pointer", textAlign: "left", width: "100%" }}>
      <div className="f fi fj">
        <div className="kanban-card-title">{item.title}</div>
        {isStalled && <span style={{ fontSize: 12 }} title="Stalled > 3 days">⚠️</span>}
      </div>
      <div className="kanban-card-meta">
        {emoji} {item.owner} · {item.role || "AGENT"}
      </div>
      <div className="kanban-card-footer">
        <span><ConfBar v={item.confidence} /></span>
        <span style={{ color: isStalled ? "var(--amber)" : "var(--text-4)" }}>
          {daysInStage}d in stage
        </span>
      </div>
      {item.decision && (
        <div style={{ marginTop: 8 }}>
          <DecisionTag decision={item.decision} />
        </div>
      )}
    </button>
  );
}

function ExpandedCard({ item, onClose }: { item: PipelineItem; onClose: () => void }) {
  const emoji = agentEmoji[item.owner] || "🤖";
  return (
    <div className="org-drawer" style={{ width: 380 }}>
      <div className="panel-head">
        <span className="panel-title">{item.title}</span>
        <button className="btn btn-ghost" onClick={onClose}>Close</button>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <div className="report-block">
          <div className="report-label">Stage</div>
          <span className="tag tag-stage">{item.stage}</span>
        </div>
        <div className="report-block">
          <div className="report-label">Owner</div>
          <div className="report-text">{emoji} {item.owner} ({item.role || "AGENT"})</div>
        </div>
        <div className="report-block">
          <div className="report-label">Confidence</div>
          <ConfBar v={item.confidence} />
        </div>
        <div className="report-block">
          <div className="report-label">Decision</div>
          <DecisionTag decision={item.decision} />
        </div>
        <Link href={`/opportunities/${item.id}`} className="btn btn-primary" style={{ textDecoration: "none", textAlign: "center" }}>
          View Full Report →
        </Link>
      </div>
    </div>
  );
}

interface Props {
  pipeline: PipelineItem[];
  validationQueue: Array<{ id: string; title: string }>;
}

export default function PipelineClient({ pipeline, validationQueue }: Props) {
  const [view, setView] = useState<"kanban" | "table">("kanban");
  const [expanded, setExpanded] = useState<PipelineItem | null>(null);

  return (
    <>
      <div className="page-head">
        <h1>Opportunity Pipeline</h1>
        <div className="f fi" style={{ gap: 8 }}>
          <div className="live-pill">
            <span className="live-dot" />
            {pipeline.length} opportunities · {validationQueue.length} awaiting validation
          </div>
          <div className="view-toggle">
            <button className={`vt-btn ${view === "kanban" ? "vt-active" : ""}`} onClick={() => setView("kanban")}>Kanban</button>
            <button className={`vt-btn ${view === "table" ? "vt-active" : ""}`} onClick={() => setView("table")}>Table</button>
          </div>
        </div>
      </div>

      {/* Stage summary */}
      <section className="stage-grid" style={{ marginBottom: 28 }}>
        {stages.map((stage) => {
          const count = pipeline.filter((p) => p.stage === stage).length;
          return (
            <div key={stage} className="panel">
              <div className="stat-label">{stageEmoji[stage]} {stage}</div>
              <div className="stat-num" style={{ color: stageColors[stage] }}>{count}</div>
            </div>
          );
        })}
      </section>

      {view === "kanban" ? (
        /* Kanban board */
        <div className="kanban-5col">
          {stages.map((stage) => {
            const items = pipeline.filter((p) => p.stage === stage);
            return (
              <div key={stage} className="kanban-col">
                <div className="kanban-col-head">
                  <span className="kanban-dot" style={{ background: stageColors[stage] }} />
                  <span className="kanban-col-title">{stage}</span>
                  <span className="kanban-col-count">{items.length}</span>
                </div>
                <div className="kanban-cards">
                  {items.map((item) => (
                    <KanbanCard key={item.id} item={item} onClick={() => setExpanded(item)} />
                  ))}
                  {items.length === 0 && <div className="kanban-empty">No items</div>}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Table view */
        <article className="panel">
          <div className="panel-head">
            <span className="panel-title">All Opportunities</span>
            <span className="panel-count">{pipeline.length}</span>
          </div>
          <div className="table-head">
            <span className="th th-grow">Opportunity</span>
            <span className="th th-md">Owner</span>
            <span className="th th-xs">Role</span>
            <span className="th th-sm">Confidence</span>
            <span className="th th-sm">Decision</span>
            <span className="th th-sm">Stage</span>
          </div>
          {pipeline.map((item) => (
            <div key={item.id} className="table-row">
              <span className="td td-grow">
                <Link href={`/opportunities/${item.id}`} className="row-name" style={{ textDecoration: "none", color: "inherit" }}>
                  {item.title}
                </Link>
              </span>
              <span className="td td-md row-sub">{item.owner}</span>
              <span className="td td-xs role-tag">{item.role || "AGENT"}</span>
              <span className="td td-sm"><ConfBar v={item.confidence} /></span>
              <span className="td td-sm"><DecisionTag decision={item.decision} /></span>
              <span className="td td-sm"><span className="tag tag-stage">{item.stage}</span></span>
            </div>
          ))}
          {pipeline.length === 0 && <div className="empty">No opportunities in pipeline</div>}
        </article>
      )}

      {/* Validation queue */}
      {validationQueue.length > 0 && (
        <article className="panel" style={{ marginTop: 20 }}>
          <div className="panel-head">
            <span className="panel-title">Awaiting Validation</span>
            <span className="panel-count">{validationQueue.length}</span>
          </div>
          {validationQueue.map((v) => (
            <div key={v.id} className="row">
              <span className="row-name">{v.title}</span>
              <span className="tag tag-stage">awaiting</span>
            </div>
          ))}
        </article>
      )}

      {/* Expanded card drawer */}
      {expanded && <ExpandedCard item={expanded} onClose={() => setExpanded(null)} />}
    </>
  );
}
