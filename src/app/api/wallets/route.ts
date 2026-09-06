import { NextResponse } from "next/server";
import { fetchBoards, fetchTrades } from "@/lib/polymarket/client";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const [boards, trades] = await Promise.all([fetchBoards(25), fetchTrades(40)]);
    return NextResponse.json({
      boards: {
        day: boards.day,
        week: boards.week,
        month: boards.month,
        all: boards.all,
        monthVol: boards.monthVol,
      },
      trades,
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : String(e) },
      { status: 500 }
    );
  }
}
