import { useCases } from "@/lib/use-cases";
import ChairmanActions from "@/app/components/chairman-actions";
import OpsPanels from "@/app/components/ops-panels";
import KPINorthStar from "@/app/components/kpi-northstar";

function StageBadge({ stage }: { stage: string }) {
  return <span className="badge badge-stage">{stage}</span>;
}

function HealthBadge({ health }: { health: string }) {
  return <span className={`badge badge-${health}`}>{health}</span>;
}

function StatusBadge({ status }: { status: string }) {
  return <span className={`badge badge-${status}`}>{status}</span>;
}

function ConfidenceBar({ value }: { value: number }) {
  const color = value >= 80 ? "var(--accent-green)" : value >= 60 ? "var(--accent-amber)" : "var(--accent-red)";
  return (
    <div className="flex items-center gap-2">
      <div className="confidence-bar">
        <div className="confidence-fill" style={{ width: `${value}%`, background: color }} />
      </div>
      <span className="mono text-xs muted">{value}%</span>
    </div>
  );
}

export default async function DashboardPage() {
  const [pipeline, validationQueue, portfolio, runs, reports, killLogs, cronJobs, todos, revenueReadyEvents] = await Promise.all([
    useCases.listPipeline(),
    useCases.listValidationQueue(),
    useCases.listPortfolio(),
    useCases.listAgentRuns(),
    useCases.listReports(),
    useCases.listKillLogs(),
    useCases.listCronJobs(),
    useCases.listTodos(),
    useCases.listRevenueReadyEvents()
  ]);

  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <h3>Mission Control</h3>
          <div className="version">Teeebeee v1.0</div>
        </div>
        <nav>
          <a href="#northstar"><span className="nav-icon">◆</span> North Star</a>
          <a href="#overrides"><span className="nav-icon">⚡</span> Overrides</a>
          <a href="#pipeline"><span className="nav-icon">◈</span> Pipeline</a>
          <a href="#validation"><span className="nav-icon">◇</span> Validation</a>
          <a href="#portfolio"><span className="nav-icon">▣</span> Portfolio</a>
          <a href="#runs"><span className="nav-icon">●</span> Agents</a>
          <a href="#reports"><span className="nav-icon">▤</span> Reports</a>
          <a href="#kills"><span className="nav-icon">✕</span> Kill Log</a>
          <a href="#cron"><span className="nav-icon">⏱</span> Cron</a>
          <a href="#todos"><span className="nav-icon">☐</span> Tasks</a>
        </nav>
      </aside>

      <main className="content">
        <div className="page-header">
          <h1>Mission Control</h1>
          <span className="meta">
            <span className="status-dot live" style={{ marginRight: 6 }} />
            OPERATIONAL · {new Date().toISOString().slice(0, 10)}
          </span>
        </div>

        <section className="grid">
          <KPINorthStar events={revenueReadyEvents} />

          <ChairmanActions pipeline={pipeline} portfolio={portfolio} />

          <article id="pipeline" className="card col-8">
            <div className="card-header">
              <h2>Opportunity Pipeline</h2>
              <span className="count">{pipeline.length}</span>
            </div>
            {pipeline.map((item) => (
              <div key={item.id} className="data-row">
                <div>
                  <div className="label">{item.title}</div>
                  <div className="sublabel">{item.owner}</div>
                </div>
                <div className="right">
                  <ConfidenceBar value={item.confidence} />
                  <StageBadge stage={item.stage} />
                </div>
              </div>
            ))}
          </article>

          <article id="validation" className="card col-4">
            <div className="card-header">
              <h2>Validation Queue</h2>
              <span className="count">{validationQueue.length}</span>
            </div>
            {validationQueue.length === 0 ? (
              <div className="empty-state">No pending validations</div>
            ) : (
              validationQueue.map((v) => (
                <div key={v.id} className="data-row">
                  <span className="label">{v.title}</span>
                  <StageBadge stage="awaiting" />
                </div>
              ))
            )}
          </article>

          <article id="portfolio" className="card col-6">
            <div className="card-header">
              <h2>Portfolio Slots</h2>
              <span className="count">{portfolio.length}</span>
            </div>
            {portfolio.map((slot) => (
              <div key={slot.slotId} className="data-row">
                <div>
                  <div className="label">{slot.project}</div>
                  <div className="sublabel">Sunset: {slot.sunsetAt}</div>
                </div>
                <StatusBadge status={slot.status} />
              </div>
            ))}
          </article>

          <article id="runs" className="card col-6">
            <div className="card-header">
              <h2>Agent Status</h2>
              <span className="count">{runs.length} agents</span>
            </div>
            {runs.map((run) => (
              <div key={run.agentId} className="data-row">
                <div>
                  <div className="label">{run.name}</div>
                  <div className="sublabel">{new Date(run.lastRunAt).toLocaleString("en-US", { timeZone: "UTC", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })} UTC</div>
                </div>
                <HealthBadge health={run.health} />
              </div>
            ))}
          </article>

          <article id="reports" className="card col-6">
            <div className="card-header">
              <h2>Reports</h2>
              <span className="count">{reports.length}</span>
            </div>
            {reports.map((report) => (
              <div key={report.id} className="data-row">
                <span className="label" style={{ flex: 1 }}>{report.summary}</span>
                <span className="sublabel">{new Date(report.createdAt).toLocaleString("en-US", { timeZone: "UTC", month: "short", day: "numeric" })}</span>
              </div>
            ))}
          </article>

          <article id="kills" className="card col-6">
            <div className="card-header">
              <h2>Kill Log</h2>
              <span className="count">{killLogs.length}</span>
            </div>
            {killLogs.length === 0 ? (
              <div className="empty-state">No kills recorded</div>
            ) : (
              killLogs.map((log) => (
                <div key={log.id} className="data-row">
                  <div>
                    <div className="label">{log.slotId}</div>
                    <div className="sublabel">{log.reason}</div>
                  </div>
                  <span className="sublabel">{new Date(log.killedAt).toLocaleString("en-US", { timeZone: "UTC", month: "short", day: "numeric" })}</span>
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
