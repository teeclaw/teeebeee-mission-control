"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Opportunity, PortfolioSlot } from "@/lib/types";

type Props = { pipeline: Opportunity[]; portfolio: PortfolioSlot[] };

declare global {
  interface Window {
    ethereum?: { request: (a: { method: string; params?: unknown[] }) => Promise<unknown> };
  }
}

export default function ChairmanActions({ pipeline, portfolio }: Props) {
  const router = useRouter();
  const [wallet, setWallet] = useState("");
  const [token, setToken] = useState("");
  const [status, setStatus] = useState("IDLE");

  async function auth() {
    if (!window.ethereum) { setStatus("ERR: No wallet provider"); return; }
    setStatus("CONNECTING…");
    try {
      const accts = (await window.ethereum.request({ method: "eth_requestAccounts" })) as string[];
      const w = accts?.[0];
      if (!w) { setStatus("ERR: No wallet"); return; }
      setWallet(w);
      const cr = await fetch("/api/auth/chairman/challenge", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ wallet: w }) });
      const cp = await cr.json();
      if (!cr.ok) { setStatus(`ERR: ${cp.error}`); return; }
      const sig = (await window.ethereum.request({ method: "personal_sign", params: [cp.message, w] })) as string;
      const vr = await fetch("/api/auth/chairman/verify", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ wallet: w, signature: sig }) });
      const vp = await vr.json();
      if (!vr.ok) { setStatus(`ERR: ${vp.error}`); return; }
      setToken(vp.sessionToken || "");
      setStatus("AUTHENTICATED");
    } catch (e) { setStatus(`ERR: ${e instanceof Error ? e.message : "unknown"}`); }
  }

  async function run(action: () => Promise<Response>, ok: string) {
    setStatus("EXECUTING…");
    try {
      const r = await action();
      const p = await r.json().catch(() => ({}));
      if (!r.ok) { setStatus(`FAIL: ${p.error || "unknown"}`); return; }
      setStatus(ok);
      router.refresh();
    } catch (e) { setStatus(`FAIL: ${e instanceof Error ? e.message : "unknown"}`); }
  }

  const opp = pipeline.find((p) => p.stage !== "launch");
  const slot = portfolio.find((p) => p.status === "active");
  const h = { "content-type": "application/json", ...(token ? { "x-chairman-session": token } : {}) };

  return (
    <article className="panel g12" id="overrides">
      <div className="panel-head">
        <span className="panel-title">Chairman Overrides</span>
        <span className={`tag ${token ? "tag-healthy" : "tag-offline"}`}>{token ? "Signed" : "Not authenticated"}</span>
      </div>
      <div className="f fg fw fi mb-3">
        <input className="input f1" value={wallet} onChange={(e) => setWallet(e.target.value)} placeholder="0x…" readOnly={!!token} style={{ minWidth: 240 }} />
        <button className="btn btn-primary" onClick={auth} disabled={!!token}>{token ? "✓ Connected" : "Authenticate"}</button>
      </div>
      <div className="f fg fw">
        <button className="btn btn-ghost" disabled={!opp || !token} onClick={() => run(() => fetch(`/api/opportunities/${opp?.id}/advance`, { method: "POST", headers: h, body: JSON.stringify({ nextStage: "launch" }) }), `ADVANCED → launch`)}>Fast-track Launch</button>
        <button className="btn btn-danger" disabled={!slot || !token} onClick={() => run(() => fetch(`/api/portfolio/${slot?.slotId}/kill`, { method: "POST", headers: h, body: JSON.stringify({ reason: "Manual kill" }) }), `KILLED ${slot?.slotId}`)}>Kill Active Slot</button>
        <button className="btn btn-ghost" disabled={!token} onClick={() => run(() => fetch("/api/reports", { method: "POST", headers: h, body: JSON.stringify({ summary: "Chairman override executed." }) }), "REPORT APPENDED")}>Append Report</button>
        <button className="btn btn-accent" disabled={!token || !opp} onClick={() => run(() => fetch("/api/revenue-ready/mark", { method: "POST", headers: h, body: JSON.stringify({ opportunityId: opp?.id, projectName: opp?.title }) }), `MARKED revenue-ready`)}>Mark Revenue-Ready</button>
      </div>
      <div className="mt-2 mono t-xs t-dim">STATUS: {status}</div>
    </article>
  );
}
