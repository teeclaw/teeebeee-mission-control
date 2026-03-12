"use client";

import { useState } from "react";
import AgentStatusPanel from "./agent-status-panel";
import OrgChartClient from "./orgchart-client";

export default function AgentsPage() {
  const [view, setView] = useState<"status" | "orgchart">("status");

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Agents</h1>
          <p className="t-muted t-sm" style={{ marginTop: 2 }}>Live status &amp; org structure</p>
        </div>
        <div className="f fi" style={{ gap: 8 }}>
          <div className="view-toggle">
            <button className={`vt-btn ${view === "status" ? "vt-active" : ""}`} onClick={() => setView("status")}>Status</button>
            <button className={`vt-btn ${view === "orgchart" ? "vt-active" : ""}`} onClick={() => setView("orgchart")}>OrgChart</button>
          </div>
        </div>
      </div>
      {view === "status" ? <AgentStatusPanel /> : <OrgChartClient />}
    </>
  );
}
