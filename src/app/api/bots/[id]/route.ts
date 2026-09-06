import { NextResponse } from "next/server";
import { readStateAsync } from "@/lib/store";
import { getStrategy } from "@/lib/strategies/catalog";

export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id } = await ctx.params;
  const state = await readStateAsync();
  const bot = state.bots.find((b) => b.id === id || b.strategyId === id);
  if (!bot) {
    return NextResponse.json({ error: "bot not found" }, { status: 404 });
  }
  const netPnl = bot.equity - bot.startingBankroll;
  return NextResponse.json({
    updatedAt: state.updatedAt,
    bot: {
      ...bot,
      feesPaid: bot.feesPaid || 0,
      realizedPnl: bot.realizedPnl || 0,
      unrealizedPnl: bot.unrealizedPnl || 0,
      netPnl,
      pnl: netPnl,
      strategy: getStrategy(bot.strategyId),
      fills: (bot.fills || []).map((f) => ({
        ...f,
        feeUsd: f.feeUsd || 0,
        realizedPnl: f.realizedPnl || 0,
      })),
    },
  });
}
