"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Opportunity, PortfolioSlot } from "@/lib/types";

type Props = {
  pipeline: Opportunity[];
  portfolio: PortfolioSlot[];
};

export default function ChairmanActions({ pipeline, portfolio }: Props) {
  const router = useRouter();
  const [wallet, setWallet] = useState("");
  const [status, setStatus] = useState<string>("Idle");

  async function run(action: () => Promise<Response>, successText: string) {
    setStatus("Running...");
    try {
      const res = await action();
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) {
        setStatus(`Failed: ${payload.error || "unknown error"}`);
        return;
      }
      setStatus(successText);
      router.refresh();
    } catch (e) {
      setStatus(`Failed: ${e instanceof Error ? e.message : "unknown error"}`);
    }
  }

  const firstActiveOpportunity = pipeline.find((p) => p.stage !== "launch");
  const firstActiveSlot = portfolio.find((p) => p.status === "active");

  return (
    <article className="card col-12">
      <h2>Chairman Manual Overrides</h2>
      <p className="muted" style={{ marginTop: 0 }}>Used for controlled stage changes, slot kills, and report injections.</p>

      <div style={{ display: "grid", gap: 10, gridTemplateColumns: "2fr 1fr 1fr 1fr", alignItems: "center" }}>
        <input
          value={wallet}
          onChange={(e) => setWallet(e.target.value)}
          placeholder="0xChairmanWallet"
          style={{ padding: 10, borderRadius: 8, border: "1px solid #355285", background: "#0d1628", color: "#e6edf7" }}
        />

        <button
          style={{ padding: "10px 12px", borderRadius: 8, border: "1px solid #355285", background: "#163056", color: "#fff" }}
          disabled={!firstActiveOpportunity}
          onClick={() => run(
            () => fetch(`/api/opportunities/${firstActiveOpportunity?.id}/advance`, {
              method: "POST",
              headers: { "content-type": "application/json", "x-chairman-wallet": wallet },
              body: JSON.stringify({ nextStage: "launch" })
            }),
            `Advanced ${firstActiveOpportunity?.title} to launch`
          )}
        >
          Fast-track Launch
        </button>

        <button
          style={{ padding: "10px 12px", borderRadius: 8, border: "1px solid #6b1f1f", background: "#7f1d1d", color: "#fff" }}
          disabled={!firstActiveSlot}
          onClick={() => run(
            () => fetch(`/api/portfolio/${firstActiveSlot?.slotId}/kill`, {
              method: "POST",
              headers: { "content-type": "application/json", "x-chairman-wallet": wallet },
              body: JSON.stringify({ reason: "Manual kill by chairman" })
            }),
            `Killed slot ${firstActiveSlot?.slotId}`
          )}
        >
          Kill First Active Slot
        </button>

        <button
          style={{ padding: "10px 12px", borderRadius: 8, border: "1px solid #355285", background: "#163056", color: "#fff" }}
          onClick={() => run(
            () => fetch("/api/reports", {
              method: "POST",
              headers: { "content-type": "application/json", "x-chairman-wallet": wallet },
              body: JSON.stringify({ summary: "Chairman override executed." })
            }),
            "Daily report appended"
          )}
        >
          Append Report
        </button>
      </div>

      <p className="muted" style={{ marginBottom: 0, marginTop: 10 }}>Status: {status}</p>
    </article>
  );
}
