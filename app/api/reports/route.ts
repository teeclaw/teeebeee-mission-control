import { NextRequest, NextResponse } from "next/server";
import { useCases } from "@/lib/use-cases";
import { extractSessionWallet } from "@/lib/auth";

export async function GET() {
  const data = await useCases.listReports();
  return NextResponse.json({ data });
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const wallet = extractSessionWallet(req);
  const gate = useCases.chairmanGate(wallet);
  if (!gate.allowed) return NextResponse.json({ error: gate.reason }, { status: 403 });

  const result = await useCases.appendDailyReport(body.summary || "");
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });
  return NextResponse.json({ data: result.data }, { status: 201 });
}
