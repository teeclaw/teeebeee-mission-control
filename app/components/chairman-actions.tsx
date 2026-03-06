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
  const [status, setStatus] = useState<string>("Idle");

  async function authenticate() {
    if (!window.ethereum) {
      setStatus("Failed: wallet provider not found");
      return;
    }

    setStatus("Requesting wallet...");
    try {
      const accounts = (await window.ethereum.request({ method: "eth_requestAccounts" })) as string[];
      const selected = accounts?.[0];
      if (!selected) {
        setStatus("Failed: no wallet selected");
        return;
      }
      setWallet(selected);

      const challengeRes = await fetch("/api/auth/chairman/challenge", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ wallet: selected })
      });
      const challengePayload = await challengeRes.json();
      if (!challengeRes.ok) {
        setStatus(`Failed: ${challengePayload.error || "challenge failed"}`);
        return;
      }

      const signature = (await window.ethereum.request({
        method: "personal_sign",
        params: [challengePayload.message, selected]
      })) as string;

      const verifyRes = await fetch("/api/auth/chairman/verify", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ wallet: selected, signature })
      });
      const verifyPayload = await verifyRes.json();
      if (!verifyRes.ok) {
        setStatus(`Failed: ${verifyPayload.error || "verify failed"}`);
        return;
      }

      setSessionToken(verifyPayload.sessionToken || "");
      setStatus("Chairman authenticated");
    } catch (e) {
      setStatus(`Failed: ${e instanceof Error ? e.message : "unknown error"}`);
    }
  }

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

  const authHeaders = {
    "content-type": "application/json",
    ...(sessionToken ? { "x-chairman-session": sessionToken } : {})
  };

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
          onClick={authenticate}
        >
          Authenticate
        </button>

        <button
          style={{ padding: "10px 12px", borderRadius: 8, border: "1px solid #355285", background: "#163056", color: "#fff" }}
          disabled={!firstActiveOpportunity || !sessionToken}
          onClick={() => run(
            () => fetch(`/api/opportunities/${firstActiveOpportunity?.id}/advance`, {
              method: "POST",
              headers: authHeaders,
              body: JSON.stringify({ nextStage: "launch" })
            }),
            `Advanced ${firstActiveOpportunity?.title} to launch`
          )}
        >
          Fast-track Launch
        </button>

        <button
          style={{ padding: "10px 12px", borderRadius: 8, border: "1px solid #6b1f1f", background: "#7f1d1d", color: "#fff" }}
          disabled={!firstActiveSlot || !sessionToken}
          onClick={() => run(
            () => fetch(`/api/portfolio/${firstActiveSlot?.slotId}/kill`, {
              method: "POST",
              headers: authHeaders,
              body: JSON.stringify({ reason: "Manual kill by chairman" })
            }),
            `Killed slot ${firstActiveSlot?.slotId}`
          )}
        >
          Kill First Active Slot
        </button>
      </div>

      <div style={{ marginTop: 10 }}>
        <button
          style={{ padding: "10px 12px", borderRadius: 8, border: "1px solid #355285", background: "#163056", color: "#fff" }}
          disabled={!sessionToken}
          onClick={() => run(
            () => fetch("/api/reports", {
              method: "POST",
              headers: authHeaders,
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
