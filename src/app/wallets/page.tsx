"use client";

import { useEffect, useMemo, useState } from "react";
import {
  money,
  SortTh,
  useSortableRows,
} from "@/components/SortableTable";

type Leader = {
  rank: string;
  proxyWallet: string;
  userName: string;
  vol: number;
  pnl: number;
};
type Trade = {
  proxyWallet: string;
  side: string;
  size: number;
  price: number;
  title: string;
  slug: string;
  outcome: string;
  timestamp: number;
};

export default function WalletsPage() {
  const [boards, setBoards] = useState<Record<string, Leader[]> | null>(null);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [tab, setTab] = useState("month");
  const [err, setErr] = useState("");

  useEffect(() => {
    fetch("/api/wallets")
      .then(async (r) => {
        const j = await r.json();
        if (!r.ok) throw new Error(j.error || "Failed");
        setBoards(j.boards);
        setTrades(j.trades || []);
      })
      .catch((e) => setErr(String(e.message || e)));
  }, []);

  const leaders = useMemo(() => boards?.[tab] || boards?.month || [], [boards, tab]);
  const leaderSort = useSortableRows(leaders, "pnl", "desc");
  const tradeSort = useSortableRows(trades, "timestamp", "desc");

  return (
    <div className="space-y-4">
      <section className="panel p-4">
        <h2 className="text-2xl font-semibold">Wallets & tape</h2>
        <p className="text-sm text-[var(--muted)]">
          Live Polymarket leaderboards and recent trades. Tap headers to sort.
        </p>
        {err ? <p className="mt-2 text-[var(--danger)] font-mono text-sm">{err}</p> : null}
      </section>

      <div className="flex flex-wrap gap-2">
        {["day", "week", "month", "all", "monthVol"].map((k) => (
          <button
            key={k}
            className="btn"
            style={tab === k ? { borderColor: "var(--accent)", color: "var(--accent)" } : undefined}
            onClick={() => setTab(k)}
          >
            {k}
          </button>
        ))}
      </div>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="panel overflow-x-auto">
          <div className="border-b border-[var(--line)] px-4 py-3 font-mono text-xs uppercase tracking-[0.16em]">
            Leaderboard
          </div>
          <table>
            <thead>
              <tr>
                <SortTh label="#" column="rank" sortKey={leaderSort.sortKey} sortDir={leaderSort.sortDir} onSort={leaderSort.toggle} />
                <SortTh label="User" column="userName" sortKey={leaderSort.sortKey} sortDir={leaderSort.sortDir} onSort={leaderSort.toggle} />
                <SortTh label="PnL" column="pnl" sortKey={leaderSort.sortKey} sortDir={leaderSort.sortDir} onSort={leaderSort.toggle} />
                <SortTh label="Vol" column="vol" sortKey={leaderSort.sortKey} sortDir={leaderSort.sortDir} onSort={leaderSort.toggle} />
              </tr>
            </thead>
            <tbody>
              {leaderSort.sorted.slice(0, 40).map((r) => (
                <tr key={r.proxyWallet}>
                  <td className="stat">{r.rank}</td>
                  <td>
                    <div>{r.userName || "—"}</div>
                    <div className="font-mono text-[11px] text-[var(--muted)]">
                      {r.proxyWallet.slice(0, 10)}…
                    </div>
                  </td>
                  <td className="stat">{money(r.pnl, 0)}</td>
                  <td className="stat">{money(r.vol, 0)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="panel overflow-x-auto">
          <div className="border-b border-[var(--line)] px-4 py-3 font-mono text-xs uppercase tracking-[0.16em]">
            Recent trades
          </div>
          <table>
            <thead>
              <tr>
                <SortTh label="Side" column="side" sortKey={tradeSort.sortKey} sortDir={tradeSort.sortDir} onSort={tradeSort.toggle} />
                <SortTh label="Market" column="title" sortKey={tradeSort.sortKey} sortDir={tradeSort.sortDir} onSort={tradeSort.toggle} />
                <SortTh label="Px" column="price" sortKey={tradeSort.sortKey} sortDir={tradeSort.sortDir} onSort={tradeSort.toggle} />
                <SortTh label="Size" column="size" sortKey={tradeSort.sortKey} sortDir={tradeSort.sortDir} onSort={tradeSort.toggle} />
              </tr>
            </thead>
            <tbody>
              {tradeSort.sorted.slice(0, 40).map((t, i) => (
                <tr key={`${t.proxyWallet}-${t.timestamp}-${i}`}>
                  <td className="font-mono text-xs">{t.side}</td>
                  <td>
                    <div className="max-w-xs truncate">{t.title}</div>
                    <div className="font-mono text-[11px] text-[var(--muted)]">{t.outcome}</div>
                  </td>
                  <td className="stat">{t.price.toFixed(3)}</td>
                  <td className="stat">{t.size.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
