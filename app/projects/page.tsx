import { useCases } from "@/lib/use-cases";

export default async function ProjectsPage() {
  const [portfolio, killLogs] = await Promise.all([
    useCases.listPortfolio(),
    useCases.listKillLogs(),
  ]);

  const active = portfolio.filter((s) => s.status === "active");
  const sunset = portfolio.filter((s) => s.status === "sunset");

  return (
    <>
      <div className="page-head">
        <h1>Projects</h1>
        <div className="live-pill">
          <span className="live-dot" />
          {active.length} active · {sunset.length} sunset
        </div>
      </div>

      <section className="g">
        <div className="panel g4">
          <div className="stat-label">Active</div>
          <div className="stat-num green">{active.length}</div>
        </div>
        <div className="panel g4">
          <div className="stat-label">Sunset</div>
          <div className="stat-num amber">{sunset.length}</div>
        </div>
        <div className="panel g4">
          <div className="stat-label">Killed</div>
          <div className="stat-num red">{killLogs.length}</div>
        </div>

        {/* Active projects */}
        <article className="panel g12">
          <div className="panel-head">
            <span className="panel-title">Active Projects</span>
            <span className="panel-count">{active.length}</span>
          </div>
          {active.length === 0 ? (
            <div className="empty">No active projects</div>
          ) : (
            <div className="project-grid">
              {active.map((slot) => (
                <div key={slot.slotId} className="project-card">
                  <div className="project-card-status">
                    <span className="health-dot dot-green" />
                    <span className="tag tag-active">active</span>
                  </div>
                  <div className="project-card-name">{slot.project}</div>
                  <div className="project-card-meta">
                    <span>Slot: {slot.slotId}</span>
                    <span>Sunset: {slot.sunsetAt}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </article>

        {/* Sunset projects */}
        {sunset.length > 0 && (
          <article className="panel g12">
            <div className="panel-head">
              <span className="panel-title">Sunset Projects</span>
              <span className="panel-count">{sunset.length}</span>
            </div>
            {sunset.map((slot) => (
              <div key={slot.slotId} className="row">
                <div className="row-left">
                  <span className="row-name">{slot.project}</span>
                  <span className="row-sub">Slot: {slot.slotId} · Sunset: {slot.sunsetAt}</span>
                </div>
                <span className="tag tag-sunset">sunset</span>
              </div>
            ))}
          </article>
        )}

        {/* Kill log */}
        <article className="panel g12">
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
                <div className="row-right">
                  <span className="row-sub">{k.killedBy}</span>
                  <span className="row-sub">{new Date(k.killedAt).toLocaleDateString("en-US", { timeZone: "UTC", month: "short", day: "numeric" })}</span>
                </div>
              </div>
            ))
          )}
        </article>
      </section>
    </>
  );
}
