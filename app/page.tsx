import { useCases } from "@/lib/use-cases";
import ChairmanActions from "@/app/components/chairman-actions";
import OpsPanels from "@/app/components/ops-panels";
import KPINorthStar from "@/app/components/kpi-northstar";

function ConfBar({ v }: { v: number }) {
  const c = v >= 80 ? "var(--green)" : v >= 60 ? "var(--amber)" : "var(--red)";
  return (
    <div className="conf-wrap">
      <div className="conf-bar"><div className="conf-fill" style={{ width: `${v}%`, background: c }} /></div>
      <span className="conf-num">{v}%</span>
    </div>
  );
}

export default async function DashboardPage() {
  const [pipeline, vq, portfolio, runs, reports, killLogs, cronJobs, todos, revEvents] = await Promise.all([
    useCases.listPipeline(), useCases.listValidationQueue(), useCases.listPortfolio(),
    useCases.listAgentRuns(), useCases.listReports(), useCases.listKillLogs(),
    useCases.listCronJobs(), useCases.listTodos(), useCases.listRevenueReadyEvents()
  ]);

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="sb-brand">
          <h3>Mission Control</h3>
          <p>Teeebeee · v1.0</p>
        </div>
        <div className="sb-section">
          <div className="sb-section-label">Overview</div>
          <a className="sb-link" href="#northstar"><span className="sb-icon">◆</span> North Star</a>
          <a className="sb-link" href="#overrides"><span className="sb-icon">⚡</span> Overrides</a>
        </div>
        <div className="sb-section">
          <div className="sb-section-label">Pipeline</div>
          <a className="sb-link" href="#pipeline"><span className="sb-icon">◈</span> Opportunities</a>
          <a className="sb-link" href="#validation"><span className="sb-icon">◇</span> Validation</a>
          <a className="sb-link" href="#portfolio"><span className="sb-icon">▣</span> Portfolio</a>
        </div>
        <div className="sb-section">
          <div className="sb-section-label">Operations</div>
          <a className="sb-link" href="#runs"><span className="sb-icon">●</span> Agents</a>
          <a className="sb-link" href="#reports"><span className="sb-icon">▤</span> Reports</a>
          <a className="sb-link" href="#kills"><span className="sb-icon">✕</span> Kill Log</a>
          <a className="sb-link" href="#cron"><span className="sb-icon">⏱</span> Cron</a>
          <a className="sb-link" href="#todos"><span className="sb-icon">☐</span> Tasks</a>
        </div>
      </aside>

      <main className="main">
        <div className="page-head">
          <h1>Mission Control</h1>
          <div className="live-pill"><span className="live-dot" /> OPERATIONAL</div>
        </div>

        <section className="g">
          <KPINorthStar events={revEvents} />
          <ChairmanActions pipeline={pipeline} portfolio={portfolio} />

          <article id="pipeline" className="panel g8">
            <div className="panel-head">
              <span className="panel-title">Opportunity Pipeline</span>
              <span className="panel-count">{pipeline.length}</span>
            </div>
            {pipeline.map((item) => (
              <div key={item.id} className="row">
                <div className="row-left">
                  <span className="row-name">{item.title}</span>
                  <span className="row-sub">{item.owner}</span>
                </div>
                <div className="row-right">
                  <ConfBar v={item.confidence} />
                  <span className="tag tag-stage">{item.stage}</span>
                </div>
              </div>
            ))}
          </article>

          <article id="validation" className="panel g4">
            <div className="panel-head">
              <span className="panel-title">Validation Queue</span>
              <span className="panel-count">{vq.length}</span>
            </div>
            {vq.length === 0 ? (
              <div className="empty">No pending validations</div>
            ) : (
              vq.map((v) => (
                <div key={v.id} className="row">
                  <span className="row-name">{v.title}</span>
                  <span className="tag tag-stage">awaiting</span>
                </div>
              ))
            )}
          </article>

          <article id="portfolio" className="panel g6">
            <div className="panel-head">
              <span className="panel-title">Portfolio Slots</span>
              <span className="panel-count">{portfolio.length}</span>
            </div>
            {portfolio.map((s) => (
              <div key={s.slotId} className="row">
                <div className="row-left">
                  <span className="row-name">{s.project}</span>
                  <span className="row-sub">Sunset {s.sunsetAt}</span>
                </div>
                <span className={`tag tag-${s.status}`}>{s.status}</span>
              </div>
            ))}
          </article>

          <article id="runs" className="panel g6">
            <div className="panel-head">
              <span className="panel-title">Agent Status</span>
              <span className="panel-count">{runs.length}</span>
            </div>
            {runs.map((r) => (
              <div key={r.agentId} className="row">
                <div className="row-left">
                  <span className="row-name">{r.name}</span>
                  <span className="row-sub">{new Date(r.lastRunAt).toLocaleString("en-US", { timeZone: "UTC", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })} UTC</span>
                </div>
                <span className={`tag tag-${r.health}`}>{r.health}</span>
              </div>
            ))}
          </article>

          <article id="reports" className="panel g6">
            <div className="panel-head">
              <span className="panel-title">Reports</span>
              <span className="panel-count">{reports.length}</span>
            </div>
            {reports.map((rpt) => (
              <div key={rpt.id} className="row">
                <span className="row-name f1">{rpt.summary}</span>
                <span className="row-sub">{new Date(rpt.createdAt).toLocaleString("en-US", { timeZone: "UTC", month: "short", day: "numeric" })}</span>
              </div>
            ))}
          </article>

          <article id="kills" className="panel g6">
            <div className="panel-head">
              <span className="panel-title">Kill Log</span>
              <span className="panel-count">{killLogs.length}</span>
            </div>
            {killLogs.length === 0 ? (
              <div className="empty">No kills recorded</div>
            ) : (
              killLogs.map((k) => (
                <div key={k.id} className="row">
                  <div className="row-left">
                    <span className="row-name">{k.slotId}</span>
                    <span className="row-sub">{k.reason}</span>
                  </div>
                  <span className="row-sub">{new Date(k.killedAt).toLocaleString("en-US", { timeZone: "UTC", month: "short", day: "numeric" })}</span>
                </div>
              ))
            )}
          </article>

          <OpsPanels cronJobs={cronJobs} todos={todos} />
        </section>
      </main>
    </div>
  );
}
