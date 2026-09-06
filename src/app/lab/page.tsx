"use client";

import Link from "next/link";
import { useCallback, useState } from "react";
import {
  money,
  pnlColor,
  SortTh,
  useSortableRows,
} from "@/components/SortableTable";
import { LiveBadge, useLiveRefresh } from "@/hooks/useLiveRefresh";

type Row = {
  id: string;
  name: string;
  family: string;
  status: string;
  netPnl: number;
  realizedPnl: number;
  unrealizedPnl: number;
  feesPaid: number;
  equity: number;
  tradeCount: number;
  maxDrawdown: number;
  days: number;
  winRate: number;
  eligible: boolean;
};

export default function LabPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [winners, setWinners] = useState<Row[]>([]);
  const [rules, setRules] = useState<Record<string, number> | null>(null);
  const { sorted, sortKey, sortDir, toggle } = useSortableRows(rows, "netPnl", "desc");

  const load = useCallback(async () => {
    const j = await fetch("/api/lab").then((r) => r.json());
    setRows(j.rows || []);
    setWinners(j.winners || []);
    setRules(j.rules || null);
  }, []);
  const { updatedAt, live, setLive } = useLiveRefresh(load);

  return (
    <div className="space-y-4">
      <section className="panel p-4">
        <h2 className="text-2xl font-semibold">Strategy lab</h2>
        <p className="text-sm text-[var(--muted)]">
          Rank after continuous running. Gate: {rules?.promotionDays ?? 7} days, ≥
          {rules?.minTradesForPromotion ?? 10} trades, DD ≤
          {rules?.maxDrawdownPctForPromotion ?? 25}%. Fees included in Net PnL.
        </p>
        <div className="mt-2">
          <LiveBadge
            updatedAt={updatedAt}
            live={live}
            onToggle={() => setLive((v) => !v)}
          />
        </div>
        <p className="mt-2 font-mono text-sm text-[var(--accent)]">
          Eligible for live: {winners.length} · tap headers to sort
        </p>
      </section>

      <section className="panel overflow-x-auto">
        <table>
          <thead>
            <tr>
              <th>#</th>
              <SortTh label="Strategy" column="name" sortKey={sortKey} sortDir={sortDir} onSort={toggle} />
              <SortTh label="Family" column="family" sortKey={sortKey} sortDir={sortDir} onSort={toggle} />
              <SortTh label="Status" column="status" sortKey={sortKey} sortDir={sortDir} onSort={toggle} />
              <SortTh label="Days" column="days" sortKey={sortKey} sortDir={sortDir} onSort={toggle} />
              <SortTh label="Trades" column="tradeCount" sortKey={sortKey} sortDir={sortDir} onSort={toggle} />
              <SortTh label="Win%" column="winRate" sortKey={sortKey} sortDir={sortDir} onSort={toggle} />
              <SortTh label="DD%" column="maxDrawdown" sortKey={sortKey} sortDir={sortDir} onSort={toggle} />
              <SortTh label="Realized" column="realizedPnl" sortKey={sortKey} sortDir={sortDir} onSort={toggle} />
              <SortTh label="Unrealized" column="unrealizedPnl" sortKey={sortKey} sortDir={sortDir} onSort={toggle} />
              <SortTh label="Fees" column="feesPaid" sortKey={sortKey} sortDir={sortDir} onSort={toggle} />
              <SortTh label="Net PnL" column="netPnl" sortKey={sortKey} sortDir={sortDir} onSort={toggle} />
            </tr>
          </thead>
          <tbody>
            {sorted.map((r, i) => (
              <tr key={r.id}>
                <td className="stat">{i + 1}</td>
                <td><Link href={`/bots/${encodeURIComponent(r.id)}`} className="text-[var(--accent)]">{r.name}</Link></td>
                <td className="font-mono text-xs">{r.family}</td>
                <td className="font-mono text-xs">
                  {r.eligible ? "eligible_for_live" : r.status}
                </td>
                <td className="stat">{r.days}</td>
                <td className="stat">{r.tradeCount}</td>
                <td className="stat">{(r.winRate * 100).toFixed(0)}%</td>
                <td className="stat">{r.maxDrawdown.toFixed(1)}</td>
                <td className="stat" style={{ color: pnlColor(r.realizedPnl) }}>{money(r.realizedPnl)}</td>
                <td className="stat" style={{ color: pnlColor(r.unrealizedPnl) }}>{money(r.unrealizedPnl)}</td>
                <td className="stat text-[var(--muted)]">{money(r.feesPaid)}</td>
                <td className="stat" style={{ color: pnlColor(r.netPnl) }}>{money(r.netPnl)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
