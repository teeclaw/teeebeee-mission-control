import { NextResponse } from "next/server";
import { useCases } from "@/lib/use-cases";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const data = await useCases.listActiveBlockers();
    return NextResponse.json({ data }, {
      headers: {
        "Cache-Control": "no-cache, no-store, must-revalidate",
        Pragma: "no-cache",
        Expires: "0"
      }
    });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Failed to fetch blockers" }, { status: 503 });
  }
}
