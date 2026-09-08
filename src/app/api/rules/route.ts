import { NextResponse } from "next/server";
import { patchRulesAsync, readStateAsync } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function GET() {
  const state = await readStateAsync();
  return NextResponse.json(state.rules);
}

export async function POST(req: Request) {
  const body = await req.json();
  const state = await patchRulesAsync(body);
  return NextResponse.json(state.rules);
}
