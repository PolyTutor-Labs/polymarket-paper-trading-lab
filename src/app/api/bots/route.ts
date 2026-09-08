import { NextResponse } from "next/server";
import { readStateAsync } from "@/lib/store";
import { getStrategy } from "@/lib/strategies/catalog";
import { setBotStatus, startMany, stopAllBots } from "@/lib/bots/runner";

export const dynamic = "force-dynamic";

function enrich(
  b: Awaited<ReturnType<typeof readStateAsync>>["bots"][number]
) {
  const netPnl = b.equity - b.startingBankroll;
  const { fills, positions, ...rest } = b;
  return {
    ...rest,
    fillCount: (fills || []).length,
    positionCount: (positions || []).length,
    feesPaid: b.feesPaid || 0,
    realizedPnl: b.realizedPnl || 0,
    unrealizedPnl: b.unrealizedPnl || 0,
    netPnl,
    pnl: netPnl,
    strategy: getStrategy(b.strategyId),
  };
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const family = searchParams.get("family");
  const status = searchParams.get("status");
  const state = await readStateAsync();
  let bots = state.bots.map(enrich);
  if (family) bots = bots.filter((b) => b.strategy?.family === family);
  if (status) bots = bots.filter((b) => b.status === status);
  return NextResponse.json({ bots, count: bots.length, rules: state.rules });
}

export async function POST(req: Request) {
  const body = await req.json();
  if (body.action === "start_many") {
    const n = await startMany(body.family || "all");
    return NextResponse.json({ ok: true, started: n });
  }
  if (body.action === "stop_all") {
    await stopAllBots();
    return NextResponse.json({ ok: true });
  }
  if (body.action === "start" || body.action === "stop") {
    const bot = await setBotStatus(
      body.botId,
      body.action === "start" ? "running" : "stopped"
    );
    return NextResponse.json({ ok: true, bot });
  }
  return NextResponse.json({ error: "unknown action" }, { status: 400 });
}
