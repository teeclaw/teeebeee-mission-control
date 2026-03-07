"use client";

import { useState, useEffect } from "react";
import type { CronDay, CronJob } from "@/lib/types";

const ALL_DAYS: CronDay[] = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function getTodayName(): CronDay {
  return ALL_DAYS[new Date().getDay()];
}

function getNextUpJobs(jobs: CronJob[]): Array<CronJob & { eta: string }> {
  const now = new Date();
  const todayIdx = now.getDay();
  const todayName = ALL_DAYS[todayIdx];

  const scheduled = jobs.filter((j) => j.frequency !== "always");
  const result: Array<CronJob & { eta: string }> = [];

  for (const job of scheduled) {
    const jobDays: CronDay[] = job.frequency === "daily" ? ALL_DAYS : [job.day as CronDay];
    let minMs = Infinity;

    for (const d of jobDays) {
      const dayIdx = ALL_DAYS.indexOf(d);
      let daysAhead = dayIdx - todayIdx;
      if (daysAhead < 0) daysAhead += 7;

      // OpenClaw uses 24-hour format (e.g., "20:00")
      const timeParts = job.schedule.match(/(\d+):(\d+)/);
      if (!timeParts) continue;

      const hours = parseInt(timeParts[1]);
      const mins = parseInt(timeParts[2]);

      const target = new Date(now);
      target.setDate(target.getDate() + daysAhead);
      target.setHours(hours, mins, 0, 0);

      const diff = target.getTime() - now.getTime();
      if (diff > 0 && diff < minMs) minMs = diff;
    }

    if (minMs < Infinity) {
      const hrs = Math.floor(minMs / (1000 * 60 * 60));
      const eta = hrs < 1 ? `In ${Math.ceil(minMs / (1000 * 60))} min` : hrs < 24 ? `In ${hrs} hours` : `In ${Math.ceil(hrs / 24)} days`;
      result.push({ ...job, eta });
    }
  }

  result.sort((a, b) => {
    const aNum = parseInt(a.eta.replace(/\D/g, ""));
    const bNum = parseInt(b.eta.replace(/\D/g, ""));
    const aUnit = a.eta.includes("min") ? 0 : a.eta.includes("hour") ? 1 : 2;
    const bUnit = b.eta.includes("min") ? 0 : b.eta.includes("hour") ? 1 : 2;
    if (aUnit !== bUnit) return aUnit - bUnit;
    return aNum - bNum;
  });

  return result.slice(0, 8);
}

function getJobsForDay(jobs: CronJob[], day: CronDay): CronJob[] {
  return jobs.filter((j) => j.frequency === "always" ? false : j.frequency === "daily" || j.day === day);
}

export default function ScheduleView() {
  const [jobs, setJobs] = useState<CronJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"week" | "today">("week");

  useEffect(() => {
    async function fetchJobs() {
      try {
        // Add timestamp to prevent caching issues
        const response = await fetch(`/api/cron-jobs?t=${Date.now()}`);
        const result = await response.json();
        setJobs(result.data || []);
      } catch (error) {
        console.error('Failed to fetch cron jobs:', error);
        setJobs([]);
      } finally {
        setLoading(false);
      }
    }
    fetchJobs();
  }, []);

  if (loading) {
    return (
      <div className="page-head">
        <h1>Schedule</h1>
        <p className="t-muted t-sm">Loading automated routines...</p>
      </div>
    );
  }

  const today = getTodayName();
  const alwaysRunning = jobs.filter((j) => j.frequency === "always");
  const failed = jobs.filter((j) => j.status === "failed");
  const nextUp = getNextUpJobs(jobs);
  const displayDays = view === "week" ? ALL_DAYS : [today];

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Schedule</h1>
          <p className="t-muted t-sm" style={{ marginTop: 2 }}>Automated routines</p>
        </div>
        <div className="f fi" style={{ gap: 8 }}>
          <div className="view-toggle">
            <button className={`vt-btn ${view === "week" ? "vt-active" : ""}`} onClick={() => setView("week")}>Week</button>
            <button className={`vt-btn ${view === "today" ? "vt-active" : ""}`} onClick={() => setView("today")}>Today</button>
          </div>
        </div>
      </div>

      {/* Always Running */}
      {alwaysRunning.length > 0 && (
        <div className="sched-section">
          <div className="sched-section-head">
            <span className="sched-section-icon">⚡</span>
            <span className="sched-section-label">Always Running</span>
          </div>
          <div className="f fw" style={{ gap: 8 }}>
            {alwaysRunning.map((job) => (
              <div key={job.id} className="always-chip" style={{ borderColor: `${job.color}40`, background: `${job.color}15` }}>
                <span className="health-dot" style={{ background: job.color, boxShadow: `0 0 6px ${job.color}60`, width: 8, height: 8 }} />
                <span style={{ color: job.color, fontWeight: 600, fontSize: 13 }}>{job.title}</span>
                <span className="t-dim t-xs">· {job.schedule}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Failed section */}
      {failed.length > 0 && (
        <div className="sched-section failed-panel" style={{ marginTop: 16 }}>
          <div className="sched-section-head">
            <span className="sched-section-icon">⚠</span>
            <span className="sched-section-label" style={{ color: "var(--red)" }}>Failed</span>
            <span className="panel-count">{failed.length}</span>
          </div>
          {failed.map((job) => (
            <div key={job.id} className="row">
              <div className="row-left">
                <span className="row-name">{job.title}</span>
                <span className="row-sub">{job.schedule} · {job.owner}</span>
              </div>
              <span className="tag tag-failed">failed</span>
            </div>
          ))}
        </div>
      )}

      {/* Weekly grid */}
      <div className={`sched-grid ${view === "today" ? "sched-grid-single" : ""}`} style={{ marginTop: 20 }}>
        {displayDays.map((day) => {
          const dayJobs = getJobsForDay(jobs, day);
          const isToday = day === today;
          return (
            <div key={day} className="sched-col">
              <div className={`sched-col-head ${isToday ? "sched-col-today" : ""}`}>{day}</div>
              <div className="sched-col-body">
                {dayJobs.map((job) => (
                  <div
                    key={job.id}
                    className="sched-card"
                    style={{ borderLeft: `3px solid ${job.color}`, background: `${job.color}10` }}
                  >
                    <div className="sched-card-title" style={{ color: job.color }}>{job.title}</div>
                    <div className="sched-card-time">{job.schedule}</div>
                    {job.status !== "healthy" && (
                      <span className={`tag tag-${job.status}`} style={{ marginTop: 4, fontSize: 10, padding: "2px 6px" }}>{job.status}</span>
                    )}
                  </div>
                ))}
                {dayJobs.length === 0 && <div className="sched-empty">—</div>}
              </div>
            </div>
          );
        })}
      </div>

      {/* Next Up */}
      {nextUp.length > 0 && (
        <div className="sched-section" style={{ marginTop: 24 }}>
          <div className="sched-section-head">
            <span className="sched-section-icon">📅</span>
            <span className="sched-section-label">Next Up</span>
          </div>
          {nextUp.map((job) => (
            <div key={`${job.id}-next`} className="row">
              <span className="row-name" style={{ color: job.color }}>{job.title}</span>
              <span className="row-sub">{job.eta}</span>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
