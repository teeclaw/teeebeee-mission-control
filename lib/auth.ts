import { NextRequest } from "next/server";

export function extractWallet(req: NextRequest, bodyWallet?: unknown): string | null {
  const headerWallet = req.headers.get("x-chairman-wallet");
  if (typeof headerWallet === "string" && headerWallet.trim()) return headerWallet.trim();
  if (typeof bodyWallet === "string" && bodyWallet.trim()) return bodyWallet.trim();
  return null;
}
