import { NextRequest, NextResponse } from "next/server";
import { useCases } from "@/lib/use-cases";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const data = await useCases.getAgentDetail(params.id);
    if (!data) return NextResponse.json({ error: "Agent not found" }, { status: 404 });
    return NextResponse.json({ data }, {
      headers: {
        "Cache-Control": "no-cache, no-store, must-revalidate",
        Pragma: "no-cache",
        Expires: "0"
      }
    });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Failed to fetch agent" }, { status: 503 });
  }
}
