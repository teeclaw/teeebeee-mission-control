import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function verifySignature(rawBody: string, signature: string, secret: string) {
  const expected = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
}

export async function POST(req: NextRequest) {
  try {
    const secret = process.env.WEBHOOK_SECRET;
    if (!secret) return NextResponse.json({ error: "WEBHOOK_SECRET is not configured" }, { status: 503 });

    const supabase = getSupabaseAdmin();
    if (!supabase) return NextResponse.json({ error: "Supabase is not configured" }, { status: 503 });

    const rawBody = await req.text();
    const signature = req.headers.get("x-signature") || "";
    const eventId = req.headers.get("x-event-id") || "";
    const sentAt = req.headers.get("x-event-ts") || "";

    if (!signature || !eventId || !sentAt) {
      return NextResponse.json({ error: "Missing required headers: x-signature, x-event-id, x-event-ts" }, { status: 400 });
    }

    if (!verifySignature(rawBody, signature, secret)) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const sentAtMs = Number(sentAt);
    if (!Number.isFinite(sentAtMs) || Math.abs(Date.now() - sentAtMs) > 5 * 60 * 1000) {
      return NextResponse.json({ error: "Stale or invalid timestamp" }, { status: 400 });
    }

    const parsed = JSON.parse(rawBody);

    const { data: already } = await supabase.from("webhook_receipts").select("event_id").eq("event_id", eventId).maybeSingle();
    if (already) {
      return NextResponse.json({ ok: true, deduped: true });
    }

    const { error: rawErr } = await supabase.from("agent_events_raw").insert({
      id: crypto.randomUUID(),
      event_id: eventId,
      event_type: parsed.eventType || "agent.status",
      agent_id: parsed.agentId,
      payload: parsed,
      received_at: new Date().toISOString(),
      sent_at: new Date(sentAtMs).toISOString()
    });
    if (rawErr) return NextResponse.json({ error: rawErr.message }, { status: 500 });

    const { error: receiptErr } = await supabase.from("webhook_receipts").insert({
      event_id: eventId,
      source: parsed.source || "openclaw",
      received_at: new Date().toISOString()
    });
    if (receiptErr) return NextResponse.json({ error: receiptErr.message }, { status: 500 });

    const nowIso = new Date().toISOString();
    const freshnessSec = Math.floor((Date.now() - sentAtMs) / 1000);

    const { error: nodeErr } = await supabase.from("org_nodes").upsert({
      agent_id: parsed.agentId,
      name: parsed.name || parsed.agentId,
      role: parsed.role || "AGENT",
      team: parsed.team || "Unassigned",
      manager_id: parsed.managerId || null,
      level: Number(parsed.level || 3),
      status: parsed.status || "idle",
      health_score: Number(parsed.healthScore || 50),
      last_event_at: nowIso,
      freshness_sec: freshnessSec,
      updated_at: nowIso
    }, { onConflict: "agent_id" });

    if (nodeErr) return NextResponse.json({ error: nodeErr.message }, { status: 500 });

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Unexpected error" }, { status: 500 });
  }
}
