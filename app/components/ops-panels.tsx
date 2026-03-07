"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { CronJob, TodoItem } from "@/lib/types";

export default function OpsPanels({ cronJobs, todos }: { cronJobs: CronJob[]; todos: TodoItem[] }) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState<TodoItem["priority"]>("medium");
  const [status, setStatus] = useState("IDLE");
  const days: Array<CronJob["day"]> = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const dailyJobs = cronJobs.filter((j) => j.day === "All");
  const weeklyJobs = cronJobs.filter((j) => j.day !== "All");

  async function addTodo() {
    if (!title.trim()) return;
    setStatus("ADDING…");
    const r = await fetch("/api/tasks", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ title, priority }) });
    if (!r.ok) { setStatus("FAILED"); return; }
    setTitle(""); setStatus("ADDED"); router.refresh();
  }

  async function toggleTodo(id: string) {
    await fetch(`/api/tasks/${id}/toggle`, { method: "POST" });
    router.refresh();
  }

  return (
    <>
      <article id="cron" className="panel g12">
        <div className="panel-head">
          <span className="panel-title">Cron Schedule</span>
          <span className="panel-count">{cronJobs.length} jobs</span>
        </div>
        {dailyJobs.length > 0 && (
          <div className="mb-3">
            <div className="cal-day-head" style={{ marginBottom: 8, textAlign: "left" }}>Daily</div>
            <div className="daily-jobs-grid">
              {dailyJobs.map((job) => (
                <div key={job.id} className="cal-card" style={job.color ? { borderLeft: `3px solid ${job.color}` } : undefined}>
                  <div className="cal-card-title">{job.title}</div>
                  <div className="cal-card-meta">{job.schedule} · {job.owner}</div>
                  <div className="mt-1"><span className={`tag tag-${job.status}`}>{job.status}</span></div>
                </div>
              ))}
            </div>
          </div>
        )}
        {weeklyJobs.length > 0 && (
          <div>
            <div className="cal-day-head" style={{ marginBottom: 8, textAlign: "left" }}>Weekly</div>
            <div className="cal-grid">
              {days.map((day) => {
                const dayJobs = weeklyJobs.filter((j) => j.day === day);
                if (dayJobs.length === 0) return null;
                return (
                  <div key={day}>
                    <div className="cal-day-head">{day}</div>
                    {dayJobs.map((job) => (
                      <div key={job.id} className="cal-card" style={job.color ? { borderLeft: `3px solid ${job.color}` } : undefined}>
                        <div className="cal-card-title">{job.title}</div>
                        <div className="cal-card-meta">{job.schedule} · {job.owner}</div>
                        <div className="mt-1"><span className={`tag tag-${job.status}`}>{job.status}</span></div>
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          </div>
        )}
        {cronJobs.length === 0 && <div className="empty">No cron jobs configured</div>}
      </article>

      <article id="todos" className="panel g12">
        <div className="panel-head">
          <span className="panel-title">Tasks</span>
          <span className="panel-count">{todos.filter((t) => t.status === "pending").length} pending</span>
        </div>
        <div className="f fg fw mb-3">
          <input className="input f1" placeholder="New task…" value={title} onChange={(e) => setTitle(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addTodo()} style={{ minWidth: 220 }} />
          <select className="select" value={priority} onChange={(e) => setPriority(e.target.value as TodoItem["priority"])}>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
          <button className="btn btn-ghost" onClick={addTodo}>Add</button>
        </div>
        {todos.map((t) => (
          <div key={t.id} className="todo-row">
            <button className={`todo-btn ${t.status === "done" ? "checked" : ""}`} onClick={() => toggleTodo(t.id)}>{t.status === "done" ? "✓" : ""}</button>
            <span className={`todo-label ${t.status === "done" ? "done" : ""}`}>{t.title}</span>
            <span className={`prio prio-${t.priority}`}>{t.priority}</span>
          </div>
        ))}
        <div className="mt-2 mono t-xs t-dim">STATUS: {status}</div>
      </article>
    </>
  );
}
