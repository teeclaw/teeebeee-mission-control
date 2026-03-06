import type { RevenueReadyEvent } from "@/lib/types";

function countInLastDays(events: RevenueReadyEvent[], days: number, now = Date.now()) {
  const cutoff = now - days * 24 * 60 * 60 * 1000;
  return events.filter((e) => new Date(e.recordedAt).getTime() >= cutoff).length;
}

export default function KPINorthStar({ events }: { events: RevenueReadyEvent[] }) {
  const now = Date.now();
  const current30 = countInLastDays(events, 30, now);
  const prev30 = events.filter((e) => {
    const t = new Date(e.recordedAt).getTime();
    return t >= now - 60 * 24 * 60 * 60 * 1000 && t < now - 30 * 24 * 60 * 60 * 1000;
  }).length;
  const delta = current30 - prev30;

  const deltaClass = delta > 0 ? "positive" : delta < 0 ? "negative" : "neutral";
  const deltaText = delta > 0 ? `+${delta} vs prev 30d` : delta < 0 ? `${delta} vs prev 30d` : "No change";

  return (
    <article className="card kpi-hero col-12" id="northstar">
      <div className="card-header">
        <h2>North Star KPI</h2>
        <span className="flex items-center gap-2">
          <span className="status-dot live" />
          <span className="text-xs muted mono">LIVE</span>
        </span>
      </div>
      <div className="flex items-center gap-3" style={{ flexWrap: "wrap" }}>
        <div style={{ flex: 1 }}>
          <div className="kpi-label">Revenue-ready opportunities</div>
          <div className="kpi-value">{current30}</div>
          <div className="mt-2">
            <span className={`kpi-delta ${deltaClass}`}>{deltaText}</span>
          </div>
        </div>
        <div className="muted text-sm" style={{ maxWidth: 260 }}>
          Measures validated opportunities that reached monetization-ready status within the last 30 days.
        </div>
      </div>
    </article>
  );
}
