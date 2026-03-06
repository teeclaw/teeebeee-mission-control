import { NextResponse } from "next/server";
import { useCases } from "@/lib/use-cases";

export async function POST(_: Request, { params }: { params: { id: string } }) {
  const result = await useCases.toggleTodo(params.id);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 404 });
  return NextResponse.json({ data: result.data });
}
