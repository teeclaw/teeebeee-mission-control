import { NextResponse } from "next/server";
import { useCases } from "@/lib/use-cases";

export async function GET() {
  const data = await useCases.listCronJobs();
  return NextResponse.json({ data });
}
