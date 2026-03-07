import { NextResponse } from "next/server";
import { useCases } from "@/lib/use-cases";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    console.log("🔍 [API] /api/cron-jobs called");
    const data = await useCases.listCronJobs();
    console.log("🔍 [API] useCases.listCronJobs() returned:", data?.length || 0, "jobs");
    
    // Force no caching for real-time cron data
    return NextResponse.json(
      { data }, 
      { 
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      }
    );
  } catch (error) {
    console.error("🔍 [API] Error in /api/cron-jobs:", error);
    return NextResponse.json(
      { data: [], error: "Failed to fetch cron jobs" }, 
      { 
        status: 500,
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      }
    );
  }
}
