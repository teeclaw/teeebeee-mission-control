"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { CronJob, TodoItem } from "@/lib/types";

export default function OpsPanels({ cronJobs, todos }: { cronJobs: CronJob[]; todos: TodoItem[] }) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState<TodoItem["priority"]>("medium");
  const [status, setStatus] = useState("Idle");

  const days: Array<CronJob["day"]> = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  async function addTodo() {
    if (!title.trim()) return;
    setStatus("Adding task...");
    const res = await fetch("/api/tasks", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ title, priority })
    });
    const payload = await res.json().catch(() => ({}));
    if (!res.ok) {
      setStatus(`Failed: ${payload.error || "unknown error"}`);
      return;
    }
    setTitle("");
    setStatus("Task added");
    router.refresh();
  }

  async function toggleTodo(id: string) {
    setStatus("Updating task...");
    const res = await fetch(`/api/tasks/${id}/toggle`, { method: "POST" });
    const payload = await res.json().catch(() => ({}));
    if (!res.ok) {
      setStatus(`Failed: ${payload.error || "unknown error"}`);
      return;
    }
    setStatus("Task updated");
    router.refresh();
  }

  return (
    <>
      <article id="cron" className="card col-12">
        <h2>Cron Job Monitoring (Calendar View)</h2>
        <div className="trello-calendar">
          {days.map((day) => (
            <div key={day} className="day-column">
              <h3>{day}</h3>
              {(cronJobs.filter((j) => j.day === day)).map((job) => (
                <div key={job.id} className="cron-card">
                  <div><strong>{job.title}</strong></div>
                  <div className="muted">{job.schedule} • {job.owner}</div>
                  <div className="badge" style={{ marginTop: 6 }}>{job.status}</div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </article>

      <article id="todos" className="card col-12">
        <h2>Pending Tasks & Todo List</h2>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
          <input
            placeholder="Add new task"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            style={{ flex: 1, minWidth: 240, padding: 10, borderRadius: 8, border: "1px solid #355285", background: "#0d1628", color: "#e6edf7" }}
          />
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value as TodoItem["priority"])}
            style={{ padding: 10, borderRadius: 8, border: "1px solid #355285", background: "#0d1628", color: "#e6edf7" }}
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
          <button onClick={addTodo} style={{ padding: "10px 12px", borderRadius: 8, border: "1px solid #355285", background: "#163056", color: "#fff" }}>Add</button>
        </div>

        <ul>
          {todos.map((t) => (
            <li key={t.id}>
              <button onClick={() => toggleTodo(t.id)} style={{ marginRight: 8 }}>
                {t.status === "done" ? "↺" : "✓"}
              </button>
              <strong>{t.title}</strong> — {t.priority} — <span className="muted">{t.status}</span>
            </li>
          ))}
        </ul>
        <p className="muted" style={{ marginBottom: 0 }}>Status: {status}</p>
      </article>
    </>
  );
}
