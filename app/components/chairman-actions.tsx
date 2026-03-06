"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Opportunity, PortfolioSlot } from "@/lib/types";

type Props = {
  pipeline: Opportunity[];
  portfolio: PortfolioSlot[];
};

declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
    };
  }
}

export default function ChairmanActions({ pipeline, portfolio }: Props) {
  const router = useRouter();
  const [wallet, setWallet] = useState("");
  const [sessionToken, setSessionToken] = useState("");
  const [status, setStatus] = useState<string>("IDLE");

  async function authenticate() {
    if (!window.ethereum) { setStatus("ERR: No wallet provider"); return; }
    setStatus("CONNECTING...");
    try {
      const accounts = (await window.ethereum.request({ method: "eth_requestAccounts" })) as string[];
      const selected = accounts?.[0];
      if (!selected) { setStatus("ERR: No wallet selected"); return; }
      setWallet(selected);
      const challengeRes = await fetch("/api/auth/chairman/challenge", {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ wallet: selected })
      });
      const challengePayload = await challengeRes.json();
      if (!challengeRes.ok) { setStatus(`ERR: ${challengePayload.error}`); return; }
      const signature = (await window.ethereum.request({
        method: "personal_sign", params: [challengePayload.message, selected]
      })) as string;
      const verifyRes = await fetch("/api/auth/chairman/verify", {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ wallet: selected, signature })
      });
      const verifyPayload = await verifyRes.json();
      if (!verifyRes.ok) { setStatus(`ERR: ${verifyPayload.error}`); return; }
      setSessionToken(verifyPayload.sessionToken || "");
      setStatus("AUTHENTICATED");
    } catch (e) { setStatus(`ERR: ${e instanceof Error ? e.message : "unknown"}`); }
  }

  async function run(action: () => Promise<Response>, successText: string) {
    setStatus("EXECUTING...");
    try {
      const res = await action();
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) { setStatus(`FAILED: ${payload.error || "unknown"}`); return; }
      setStatus(successText);
      router.refresh();
    } catch (e) { setStatus(`FAILED: ${e instanceof Error ? e.message : "unknown"}`); }
  }

  const firstOpp = pipeline.find((p) => p.stage !== "launch");
  const firstSlot = portfolio.find((p) => p.status === "active");
  const authHeaders = {
    "content-type": "application/json",
    ...(sessionToken ? { "x-chairman-session": sessionToken } : {})
  };

  return (
    <article className="card col-12" id="overrides">
      <div className="card-header">
        <h2>Chairman Overrides</h2>
        <span className={`badge ${sessionToken ? "badge-healthy" : "badge-offline"}`}>
          {sessionToken ? "Signed" : "Not authenticated"}
        </span>
      </div>

      <div className="flex gap-2 flex-wrap items-center mb-3">
        <input
          className="input"
          value={wallet}
          onChange={(e) => setWallet(e.target.value)}
          placeholder="0xChairmanWallet"
          style={{ flex: 1, minWidth: 200 }}
          readOnly={!!sessionToken}
        />
        <button className="btn btn-primary" onClick={authenticate} disabled={!!sessionToken}>
          {sessionToken ? "Connected" : "Authenticate"}
        </button>
      </div>

      <div className="flex gap-2 flex-wrap">
        <button
          className="btn btn-secondary"
          disabled={!firstOpp || !sessionToken}
          onClick={() => run(
            () => fetch(`/api/opportunities/${firstOpp?.id}/advance`, {
              method: "POST", headers: authHeaders,
              body: JSON.stringify({ nextStage: "launch" })
            }),
            `ADVANCED: ${firstOpp?.title} → launch`
          )}
        >
          Fast-track Launch
        </button>

        <button
          className="btn btn-danger"
          disabled={!firstSlot || !sessionToken}
          onClick={() => run(
            () => fetch(`/api/portfolio/${firstSlot?.slotId}/kill`, {
              method: "POST", headers: authHeaders,
              body: JSON.stringify({ reason: "Manual kill by chairman" })
            }),
            `KILLED: ${firstSlot?.slotId}`
          )}
        >
          Kill Active Slot
        </button>

        <button
          className="btn btn-secondary"
          disabled={!sessionToken}
          onClick={() => run(
            () => fetch("/api/reports", {
              method: "POST", headers: authHeaders,
              body: JSON.stringify({ summary: "Chairman override executed." })
            }),
            "REPORT APPENDED"
          )}
        >
          Append Report
        </button>

        <button
          className="btn btn-primary"
          disabled={!sessionToken || !firstOpp}
          onClick={() => run(
            () => fetch("/api/revenue-ready/mark", {
              method: "POST", headers: authHeaders,
              body: JSON.stringify({ opportunityId: firstOpp?.id, projectName: firstOpp?.title })
            }),
            `MARKED: ${firstOpp?.title} revenue-ready`
          )}
        >
          Mark Revenue-Ready
        </button>
      </div>

      <div className="mt-2 mono text-xs muted">STATUS: {status}</div>
    </article>
  );
}
