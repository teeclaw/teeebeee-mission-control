import { NextRequest, NextResponse } from "next/server";
import { useCases } from "@/lib/use-cases";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const wallet = typeof body?.wallet === "string" ? body.wallet : null;
  const result = useCases.chairmanGate(wallet);
  return NextResponse.json(result, { status: result.allowed ? 200 : 403 });
}
