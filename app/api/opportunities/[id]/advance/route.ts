import { NextRequest, NextResponse } from "next/server";
import { useCases } from "@/lib/use-cases";
import { extractWallet } from "@/lib/auth";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json().catch(() => ({}));
  const wallet = extractWallet(req, body.wallet);
  const gate = useCases.chairmanGate(wallet);
  if (!gate.allowed) return NextResponse.json({ error: gate.reason }, { status: 403 });

  const result = await useCases.advanceOpportunityStage(params.id, body.nextStage);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });
  return NextResponse.json({ data: result.data });
}
