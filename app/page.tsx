import { useCases } from "@/lib/use-cases";
import ChairmanActions from "@/app/components/chairman-actions";
import KPINorthStar from "@/app/components/kpi-northstar";
import OpsPanels from "@/app/components/ops-panels";

export default async function DashboardPage() {
  const [pipeline, portfolio, runs, reports, killLogs, todos, revEvents] = await Promise.all([
    useCases.listPipeline(),
    useCases.listPortfolio(),
    useCases.listAgentRuns(),
    useCases.listReports(),
    useCases.listKillLogs(),
    useCases.listTodos(),
    useCases.listRevenueReadyEvents(),
  ]);

  return (
    <>
      <div className="page-head">
        <h1>Dashboard</h1>
        <div className="live-pill"><span className="live-dot" /> OPERATIONAL</div>
      </div>

      <section className="g">
        <KPINorthStar events={revEvents} />
        <ChairmanActions pipeline={pipeline} portfolio={portfolio} />

        {/* Summary cards */}
        <div className="panel g3">
          <div className="stat-label">Pipeline</div>
          <div className="stat-num">{pipeline.length}</div>
          <div className="stat-sub">active opportunities</div>
        </div>
        <div className="panel g3">
          <div className="stat-label">Projects</div>
          <div className="stat-num">{portfolio.length}</div>
          <div className="stat-sub">portfolio slots</div>
        </div>
        <div className="panel g3">
          <div className="stat-label">Agents</div>
          <div className="stat-num">{runs.length}</div>
          <div className="stat-sub">{runs.filter(r => r.health === "healthy").length} healthy</div>
        </div>
        <div className="panel g3">
          <div className="stat-label">Kills</div>
          <div className="stat-num">{killLogs.length}</div>
          <div className="stat-sub">total terminated</div>
        </div>

        {/* Reports */}
        <article className="panel g6">
          <div className="panel-head">
            <span className="panel-title">Latest Reports</span>
            <span className="panel-count">{reports.length}</span>
          </div>
          {reports.slice(0, 5).map((rpt) => (
            <div key={rpt.id} className="row">
              <span className="row-name f1">{rpt.summary}</span>
              <span className="row-sub">{new Date(rpt.createdAt).toLocaleDateString("en-US", { timeZone: "UTC", month: "short", day: "numeric" })}</span>
            </div>
          ))}
          {reports.length === 0 && <div className="empty">No reports yet</div>}
        </article>

        {/* Kill log */}
        <article className="panel g6">
          <div className="panel-head">
            <span className="panel-title">Kill Log</span>
            <span className="panel-count">{killLogs.length}</span>
          </div>
          {killLogs.slice(0, 5).map((k) => (
            <div key={k.id} className="row">
              <div className="row-left">
                <span className="row-name">{k.slotId}</span>
                <span className="row-sub">{k.reason}</span>
              </div>
              <span className="row-sub">{new Date(k.killedAt).toLocaleDateString("en-US", { timeZone: "UTC", month: "short", day: "numeric" })}</span>
            </div>
          ))}
          {killLogs.length === 0 && <div className="empty">No kills recorded</div>}
        </article>

        <OpsPanels cronJobs={[]} todos={todos} />
      </section>
    </>
  );
}
