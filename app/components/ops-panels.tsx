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

  async function addTodo() {
    if (!title.trim()) return;
    setStatus("ADDING...");
    const res = await fetch("/api/tasks", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ title, priority })
    });
    if (!res.ok) { setStatus("FAILED"); return; }
    setTitle("");
    setStatus("ADDED");
    router.refresh();
  }

  async function toggleTodo(id: string) {
    const res = await fetch(`/api/tasks/${id}/toggle`, { method: "POST" });
    if (!res.ok) return;
    router.refresh();
  }

  return (
    <>
      <article id="cron" className="card col-12">
        <div className="card-header">
          <h2>Cron Schedule</h2>
          <span className="count">{cronJobs.length} jobs</span>
        </div>
        <div className="calendar-grid">
          {days.map((day) => {
            const jobsForDay = cronJobs.filter((j) => j.day === day);
            return (
              <div key={day} className="day-col">
                <div className="day-col-header">{day}</div>
                {jobsForDay.map((job) => (
                  <div key={job.id} className="cron-card">
                    <div className="cron-title">{job.title}</div>
                    <div className="cron-meta">{job.schedule} · {job.owner}</div>
                    <div className="mt-2">
                      <span className={`badge badge-${job.status}`}>{job.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </article>

      <article id="todos" className="card col-12">
        <div className="card-header">
          <h2>Tasks</h2>
          <span className="count">
            {todos.filter((t) => t.status === "pending").length} pending
          </span>
        </div>

        <div className="flex gap-2 flex-wrap mb-3">
          <input
            className="input"
            placeholder="New task..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addTodo()}
            style={{ flex: 1, minWidth: 220 }}
          />
          <select className="select" value={priority} onChange={(e) => setPriority(e.target.value as TodoItem["priority"])}>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
          <button className="btn btn-secondary" onClick={addTodo}>Add</button>
        </div>

        <div>
          {todos.map((t) => (
            <div key={t.id} className="todo-item">
              <button
                className={`todo-check ${t.status === "done" ? "done" : ""}`}
                onClick={() => toggleTodo(t.id)}
              >
                {t.status === "done" ? "✓" : ""}
              </button>
              <span className={`todo-text ${t.status === "done" ? "done" : ""}`}>{t.title}</span>
              <span className={`todo-priority priority-${t.priority}`}>{t.priority}</span>
            </div>
          ))}
        </div>

        <div className="mt-2 mono text-xs muted">STATUS: {status}</div>
      </article>
    </>
  );
}
