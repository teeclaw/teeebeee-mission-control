import { NextResponse } from "next/server";
import { useCases } from "@/lib/use-cases";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const data = await useCases.listAgentRuns();
    return NextResponse.json({ data });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Failed to fetch agent runs" }, { status: 503 });
  }
}
