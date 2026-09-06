import { NextResponse } from "next/server";
import { readStateAsync } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function GET() {
  const state = await readStateAsync();
  return NextResponse.json(state);
}
