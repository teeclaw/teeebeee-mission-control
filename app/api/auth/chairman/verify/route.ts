import { NextRequest, NextResponse } from "next/server";
import { verifyChallenge } from "@/lib/siwe";
import { createChairmanSession } from "@/lib/chairman-session";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const wallet = typeof body?.wallet === "string" ? body.wallet : "";
  const signature = typeof body?.signature === "string" ? body.signature : "";

  if (!wallet || !signature) {
    return NextResponse.json({ error: "wallet and signature required" }, { status: 400 });
  }

  const result = await verifyChallenge(wallet, signature);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 403 });

  const token = createChairmanSession(wallet);
  const res = NextResponse.json({ ok: true, sessionToken: token });
  res.cookies.set("chairman_session", token, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    maxAge: 60 * 20,
    path: "/"
  });
  return res;
}
