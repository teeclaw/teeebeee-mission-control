import { NextRequest } from "next/server";
import { readChairmanSession } from "@/lib/chairman-session";

export function extractWallet(req: NextRequest, bodyWallet?: unknown): string | null {
  const headerWallet = req.headers.get("x-chairman-wallet");
  if (typeof headerWallet === "string" && headerWallet.trim()) return headerWallet.trim();
  if (typeof bodyWallet === "string" && bodyWallet.trim()) return bodyWallet.trim();
  return null;
}

export function extractSessionWallet(req: NextRequest): string | null {
  const token = req.headers.get("x-chairman-session") || req.cookies.get("chairman_session")?.value;
  const session = readChairmanSession(token);
  return session?.wallet || null;
}
