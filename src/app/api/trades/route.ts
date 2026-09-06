import { NextResponse } from "next/server";
import { readTradeJournal } from "@/lib/store/journal";
import { getStrategy } from "@/lib/strategies/catalog";
import { readStateAsync } from "@/lib/store";

export const dynamic = "force-dynamic";

/** Durable trade journal across all bots (jsonl), newest first. */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const botId = searchParams.get("botId") || undefined;
  const limit = Math.min(Number(searchParams.get("limit") || 200), 2000);
  const fills = readTradeJournal({ botId, limit });
  const state = await readStateAsync();
  const byId = new Map(state.bots.map((b) => [b.id, b]));
  const rows = fills.map((f) => {
    const bot = byId.get(f.botId);
    const strategy = bot ? getStrategy(bot.strategyId) : undefined;
    return {
      ...f,
      feeUsd: f.feeUsd || 0,
      realizedPnl: f.realizedPnl || 0,
      botName: strategy?.name || f.botId,
      family: strategy?.family || "",
    };
  });
  return NextResponse.json({
    count: rows.length,
    fills: rows,
    journalPath: "data/trade-journal.jsonl",
  });
}
