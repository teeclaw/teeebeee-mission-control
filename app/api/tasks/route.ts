import { NextRequest, NextResponse } from "next/server";
import { useCases } from "@/lib/use-cases";

export async function GET() {
  const data = await useCases.listTodos();
  return NextResponse.json({ data });
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const priority = body.priority === "low" || body.priority === "high" ? body.priority : "medium";
  const result = await useCases.addTodo(body.title || "", priority);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });
  return NextResponse.json({ data: result.data }, { status: 201 });
}
