import { useCases } from "@/lib/use-cases";

function HealthBadge({ health }: { health: string }) {
  const color = health === "healthy" ? "#1f9d55" : health === "stalled" ? "#d97706" : "#b91c1c";
  return <span className="badge" style={{ borderColor: color }}>{health}</span>;
}

export default async function DashboardPage() {
  const [pipeline, validationQueue, portfolio, runs, reports, killLogs] = await Promise.all([
    useCases.listPipeline(),
    useCases.listValidationQueue(),
    useCases.listPortfolio(),
    useCases.listAgentRuns(),
    useCases.listReports(),
    useCases.listKillLogs()
  ]);

  return (
    <main>
      <div className="row" style={{ marginBottom: 16 }}>
        <h1>Teeebeee Mission Control</h1>
        <span className="muted">MVP v1</span>
      </div>

      <section className="grid">
        <article className="card col-8">
          <h2>Opportunity Pipeline Board</h2>
          <ul>
            {pipeline.map((item) => (
              <li key={item.id}>
                <strong>{item.title}</strong> — {item.stage} — confidence {item.confidence}% — owner {item.owner}
              </li>
            ))}
          </ul>
        </article>

        <article className="card col-4">
          <h2>Validation Queue</h2>
          {validationQueue.length === 0 ? (
            <p className="muted">No pending validation items.</p>
          ) : (
            <ul>
              {validationQueue.map((v) => <li key={v.id}>{v.title}</li>)}
            </ul>
          )}
        </article>

        <article className="card col-6">
          <h2>Portfolio Slot Manager</h2>
          <ul>
            {portfolio.map((slot) => (
              <li key={slot.slotId}><strong>{slot.project}</strong> — {slot.status} — sunset {slot.sunsetAt}</li>
            ))}
          </ul>
        </article>

        <article className="card col-6">
          <h2>Agent Run Monitor</h2>
          <ul>
            {runs.map((run) => (
              <li key={run.agentId}>
                <span style={{ marginRight: 8 }}>{run.name}</span>
                <HealthBadge health={run.health} />
                <span className="muted"> — {new Date(run.lastRunAt).toLocaleString("en-US", { timeZone: "UTC" })} UTC</span>
              </li>
            ))}
          </ul>
        </article>

        <article className="card col-6">
          <h2>Daily Report Feed</h2>
          <ul>
            {reports.map((report) => (
              <li key={report.id}>{report.summary} <span className="muted">({new Date(report.createdAt).toLocaleString("en-US", { timeZone: "UTC" })} UTC)</span></li>
            ))}
          </ul>
        </article>

        <article className="card col-6">
          <h2>Kill Log</h2>
          {killLogs.length === 0 ? (
            <p className="muted">No kills recorded.</p>
          ) : (
            <ul>
              {killLogs.map((log) => (
                <li key={log.id}><strong>{log.slotId}</strong> — {log.reason} <span className="muted">({new Date(log.killedAt).toLocaleString("en-US", { timeZone: "UTC" })} UTC)</span></li>
              ))}
            </ul>
          )}
        </article>
      </section>
    </main>
  );
}
