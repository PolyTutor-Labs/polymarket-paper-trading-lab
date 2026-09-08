import { NextResponse } from "next/server";
import { tickRunningBots } from "@/lib/bots/runner";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

async function runTick() {
  try {
    const result = await tickRunningBots();
    return NextResponse.json({ ok: true, ...result });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : String(e) },
      { status: 500 }
    );
  }
}

export async function POST() {
  return runTick();
}

/** Vercel Cron sends GET. */
export async function GET() {
  return runTick();
}
