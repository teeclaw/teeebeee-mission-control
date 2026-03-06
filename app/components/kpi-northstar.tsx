import type { RevenueReadyEvent } from "@/lib/types";

function countInLastDays(events: RevenueReadyEvent[], days: number, now = Date.now()) {
  const cutoff = now - days * 24 * 60 * 60 * 1000;
  return events.filter((e) => new Date(e.recordedAt).getTime() >= cutoff).length;
}

export default function KPINorthStar({ events }: { events: RevenueReadyEvent[] }) {
  const now = Date.now();
  const current30 = countInLastDays(events, 30, now);
  const prevWindowStart = now - 60 * 24 * 60 * 60 * 1000;
  const prevWindowEnd = now - 30 * 24 * 60 * 60 * 1000;
  const prev30 = events.filter((e) => {
    const t = new Date(e.recordedAt).getTime();
    return t >= prevWindowStart && t < prevWindowEnd;
  }).length;
  const delta = current30 - prev30;

  return (
    <article className="card col-12" id="northstar">
      <h2>North Star KPI</h2>
      <div className="row" style={{ alignItems: "flex-end" }}>
        <div>
          <div className="muted">Revenue-ready opportunities (last 30 days)</div>
          <div style={{ fontSize: 42, fontWeight: 700, lineHeight: 1 }}>{current30}</div>
        </div>
        <div className="muted">
          vs previous 30d: {delta >= 0 ? `+${delta}` : `${delta}`}
        </div>
      </div>
    </article>
  );
}
