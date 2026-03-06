import { NextRequest, NextResponse } from "next/server";
import { buildChallenge } from "@/lib/siwe";
import { useCases } from "@/lib/use-cases";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const wallet = typeof body?.wallet === "string" ? body.wallet : null;
  const gate = useCases.chairmanGate(wallet);
  if (!wallet || !gate.allowed) return NextResponse.json({ error: gate.reason || "wallet required" }, { status: 403 });

  const domain = req.nextUrl.hostname || "localhost";
  const challenge = buildChallenge(wallet, domain);
  return NextResponse.json(challenge);
}
