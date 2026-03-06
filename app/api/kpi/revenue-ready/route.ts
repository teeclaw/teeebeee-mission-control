import { NextResponse } from "next/server";
import { useCases } from "@/lib/use-cases";

export async function GET() {
  const events = await useCases.listRevenueReadyEvents();
  return NextResponse.json({ data: events });
}
