import { NextRequest, NextResponse } from "next/server";
import { useCases } from "@/lib/use-cases";
import { extractSessionWallet } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const wallet = extractSessionWallet(req);
  const gate = useCases.chairmanGate(wallet);
  if (!gate.allowed) return NextResponse.json({ error: gate.reason }, { status: 403 });

  const body = await req.json().catch(() => ({}));
  const result = await useCases.recordRevenueReady(body.opportunityId || "", body.projectName || "");
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });
  return NextResponse.json({ data: result.data }, { status: 201 });
}
