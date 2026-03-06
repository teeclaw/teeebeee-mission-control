import { NextRequest, NextResponse } from "next/server";
import { useCases } from "@/lib/use-cases";
import { extractSessionWallet } from "@/lib/auth";

export async function POST(req: NextRequest, { params }: { params: { slotId: string } }) {
  const body = await req.json().catch(() => ({}));
  const wallet = extractSessionWallet(req);
  const gate = useCases.chairmanGate(wallet);
  if (!gate.allowed) return NextResponse.json({ error: gate.reason }, { status: 403 });

  const result = await useCases.killPortfolioSlot(params.slotId, body.reason || "No reason provided", wallet || "unknown");
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });
  return NextResponse.json({ data: result.data });
}
