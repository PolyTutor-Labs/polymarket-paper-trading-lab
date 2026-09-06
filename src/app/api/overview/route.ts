import { NextResponse } from "next/server";
import { readStateAsync } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function GET() {
  const state = await readStateAsync();
  const bots = state.bots.map((b) => {
    const netPnl = b.equity - b.startingBankroll;
    return {
      id: b.id,
      strategyId: b.strategyId,
      status: b.status,
      equity: b.equity,
      cash: b.cash,
      feesPaid: b.feesPaid || 0,
      realizedPnl: b.realizedPnl || 0,
      unrealizedPnl: b.unrealizedPnl || 0,
      netPnl,
      tradeCount: b.tradeCount,
      maxDrawdown: b.maxDrawdown,
    };
  });
  const totals = bots.reduce(
    (acc, b) => {
      acc.equity += b.equity;
      acc.realizedPnl += b.realizedPnl;
      acc.unrealizedPnl += b.unrealizedPnl;
      acc.feesPaid += b.feesPaid;
      acc.netPnl += b.netPnl;
      if (b.status === "running" || b.status === "eligible_for_live") {
        acc.running += 1;
      }
      return acc;
    },
    {
      equity: 0,
      realizedPnl: 0,
      unrealizedPnl: 0,
      feesPaid: 0,
      netPnl: 0,
      running: 0,
    }
  );
  return NextResponse.json({
    updatedAt: state.updatedAt,
    totals,
    bots,
    rules: state.rules,
  });
}
