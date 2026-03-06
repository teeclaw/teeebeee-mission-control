import { useCases } from "@/lib/use-cases";

function HealthDot({ health }: { health: string }) {
  const cls = health === "healthy" ? "dot-green" : health === "stalled" ? "dot-amber" : "dot-red";
  return <span className={`health-dot ${cls}`} />;
}

export default async function AgentsPage() {
  const runs = await useCases.listAgentRuns();
  const healthy = runs.filter((r) => r.health === "healthy").length;
  const stalled = runs.filter((r) => r.health === "stalled").length;
  const offline = runs.filter((r) => r.health === "offline").length;

  return (
    <>
      <div className="page-head">
        <h1>Agents</h1>
        <div className="live-pill"><span className="live-dot" /> {healthy} of {runs.length} healthy</div>
      </div>

      <section className="g">
        <div className="panel g4">
          <div className="stat-label">Healthy</div>
          <div className="stat-num green">{healthy}</div>
        </div>
        <div className="panel g4">
          <div className="stat-label">Stalled</div>
          <div className="stat-num amber">{stalled}</div>
        </div>
        <div className="panel g4">
          <div className="stat-label">Offline</div>
          <div className="stat-num red">{offline}</div>
        </div>

        <article className="panel g12">
          <div className="panel-head">
            <span className="panel-title">All Agents</span>
            <span className="panel-count">{runs.length}</span>
          </div>
          <div className="agent-grid">
            {runs.map((agent) => (
              <div key={agent.agentId} className="agent-card">
                <div className="f fi fj">
                  <div className="f fi" style={{ gap: 10 }}>
                    <HealthDot health={agent.health} />
                    <div>
                      <div className="agent-name">{agent.name}</div>
                      <div className="agent-id">{agent.agentId}</div>
                    </div>
                  </div>
                  <span className={`tag tag-${agent.health}`}>{agent.health}</span>
                </div>
                <div className="agent-meta">
                  Last active: {new Date(agent.lastRunAt).toLocaleString("en-US", { timeZone: "UTC", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })} UTC
                </div>
              </div>
            ))}
          </div>
        </article>
      </section>
    </>
  );
}
