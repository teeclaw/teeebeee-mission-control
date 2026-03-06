import { useCases } from "@/lib/use-cases";
import type { CronJob } from "@/lib/types";

const dayOrder: Array<CronJob["day"]> = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export default async function CronPage() {
  const cronJobs = await useCases.listCronJobs();
  const failed = cronJobs.filter((j) => j.status === "failed");

  return (
    <>
      <div className="page-head">
        <h1>Cron Jobs</h1>
        <div className="live-pill">
          <span className="live-dot" />
          {cronJobs.length} jobs · {failed.length} failed
        </div>
      </div>

      {/* Failed section — always visible */}
      <article className="panel failed-panel" style={{ marginBottom: 24 }}>
        <div className="panel-head">
          <span className="panel-title" style={{ color: "var(--red)" }}>⚠ Failed Jobs</span>
          <span className="panel-count">{failed.length}</span>
        </div>
        {failed.length === 0 ? (
          <div className="empty">All jobs running clean</div>
        ) : (
          failed.map((job) => (
            <div key={job.id} className="row">
              <div className="row-left">
                <span className="row-name">{job.title}</span>
                <span className="row-sub">{job.schedule} · {job.owner}</span>
              </div>
              <div className="row-right">
                <span className="tag tag-failed">failed</span>
                <span className="row-sub">{job.day}</span>
              </div>
            </div>
          ))
        )}
      </article>

      {/* Day-by-day breakdown */}
      <section className="g">
        {dayOrder.map((day) => {
          const jobs = cronJobs.filter((j) => j.day === day);
          if (jobs.length === 0) return null;
          return (
            <article key={day} className="panel g12">
              <div className="panel-head">
                <span className="panel-title">{day}</span>
                <span className="panel-count">{jobs.length} jobs</span>
              </div>
              <div className="cron-row-grid">
                {jobs.map((job) => (
                  <div key={job.id} className="cron-row-card">
                    <div className="f fi fj">
                      <div className="f fi" style={{ gap: 10 }}>
                        <span className={`health-dot dot-${job.status === "healthy" ? "green" : job.status === "delayed" ? "amber" : "red"}`} />
                        <div>
                          <div className="row-name">{job.title}</div>
                          <div className="row-sub">{job.schedule} · {job.owner}</div>
                        </div>
                      </div>
                      <span className={`tag tag-${job.status}`}>{job.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            </article>
          );
        })}
      </section>
    </>
  );
}
