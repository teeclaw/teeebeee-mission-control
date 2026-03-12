"use client";

import { useState } from "react";
import ScheduleView from "./schedule-view";
import CronMonitor from "./cron-monitor";

export default function SchedulePage() {
  const [view, setView] = useState<"monitor" | "schedule">("monitor");

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Schedule</h1>
          <p className="t-muted t-sm" style={{ marginTop: 2 }}>Automated routines &amp; cron monitoring</p>
        </div>
        <div className="f fi" style={{ gap: 8 }}>
          <div className="view-toggle">
            <button className={`vt-btn ${view === "monitor" ? "vt-active" : ""}`} onClick={() => setView("monitor")}>Monitor</button>
            <button className={`vt-btn ${view === "schedule" ? "vt-active" : ""}`} onClick={() => setView("schedule")}>Calendar</button>
          </div>
        </div>
      </div>
      {view === "monitor" ? <CronMonitor /> : <ScheduleView />}
    </>
  );
}
