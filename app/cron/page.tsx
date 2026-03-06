import { useCases } from "@/lib/use-cases";

export default async function CronPage() {
  const cronJobs = await useCases.listCronJobs();
  const statuses = ["healthy", "delayed", "failed"] as const;

  return (
    <>
      <div className="page-head">
        <h1>Cron Jobs</h1>
        <div className="live-pill"><span className="live-dot" /> {cronJobs.length} jobs</div>
      </div>

      <section className="kanban">
        {statuses.map((status) => {
          const jobs = cronJobs.filter((j) => j.status === status);
          return (
            <div key={status} className="kanban-col">
              <div className="kanban-col-head">
                <span className={`kanban-dot dot-${status === "healthy" ? "green" : status === "delayed" ? "amber" : "red"}`} />
                <span className="kanban-col-title">{status}</span>
                <span className="kanban-col-count">{jobs.length}</span>
              </div>
              <div className="kanban-cards">
                {jobs.map((job) => (
                  <div key={job.id} className="kanban-card">
                    <div className="kanban-card-title">{job.title}</div>
                    <div className="kanban-card-meta">{job.schedule}</div>
                    <div className="kanban-card-footer">
                      <span className="kanban-card-owner">{job.owner}</span>
                      <span className="kanban-card-day">{job.day}</span>
                    </div>
                  </div>
                ))}
                {jobs.length === 0 && (
                  <div className="kanban-empty">No jobs</div>
                )}
              </div>
            </div>
          );
        })}
      </section>
    </>
  );
}
