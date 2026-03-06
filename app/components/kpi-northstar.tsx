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
  const cls = delta > 0 ? "pill-up" : delta < 0 ? "pill-down" : "pill-flat";
  const txt = delta > 0 ? `+${delta} vs prev 30d` : delta < 0 ? `${delta} vs prev 30d` : "No change";

  return (
    <article className="panel kpi-card g12" id="northstar">
      <div className="f fi fj">
        <div>
          <div className="kpi-label">Revenue-ready opportunities · 30d</div>
          <div className="kpi-num">{current30}</div>
          <div className="mt-2">
            <span className={`pill ${cls}`}>{txt}</span>
          </div>
        </div>
        <div>
          <div className="live-pill">
            <span className="live-dot" />
            LIVE
          </div>
          <p className="kpi-sub mt-3">
            Validated opportunities that reached monetization-ready status within the last 30 days.
          </p>
        </div>
      </div>
    </article>
  );
}
