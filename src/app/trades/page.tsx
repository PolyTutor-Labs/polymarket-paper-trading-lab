"use client";

import Link from "next/link";
import { Suspense, useCallback, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  money,
  pnlColor,
  SortTh,
  useSortableRows,
} from "@/components/SortableTable";
import { LiveBadge, useLiveRefresh } from "@/hooks/useLiveRefresh";

type TradeRow = {
  id: string;
  botId: string;
  botName: string;
  family: string;
  ts: string;
  title: string;
  side: "BUY" | "SELL";
  outcome: string;
  price: number;
  sizeUsd: number;
  shares: number;
  feeUsd: number;
  realizedPnl: number;
  reason: string;
  sourceWallet?: string;
};

function TradesInner() {
  const search = useSearchParams();
  const botId = search.get("botId") || "";
  const [rows, setRows] = useState<TradeRow[]>([]);
  const [q, setQ] = useState("");

  const load = useCallback(async () => {
    const url = botId
      ? `/api/trades?botId=${encodeURIComponent(botId)}&limit=500`
      : "/api/trades?limit=500";
    const res = await fetch(url);
    const json = await res.json();
    setRows(json.fills || []);
  }, [botId]);

  const { updatedAt, live, setLive } = useLiveRefresh(load);
  const filtered = useMemo(() => {
    if (!q) return rows;
    const n = q.toLowerCase();
    return rows.filter((r) =>
      `${r.botName} ${r.title} ${r.reason} ${r.side}`.toLowerCase().includes(n)
    );
  }, [rows, q]);
  const sort = useSortableRows(filtered, "ts", "desc");

  return (
    <div className="space-y-4">
      <section className="panel flex flex-col gap-3 p-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Trade journal</h2>
          <p className="text-sm text-[var(--muted)]">
            Durable fill log at <span className="font-mono">data/trade-journal.jsonl</span>
            {botId ? " · filtered to one bot" : " · all bots"}. Each bot also keeps
            its last 500 fills.
          </p>
        </div>
        <LiveBadge
          updatedAt={updatedAt}
          live={live}
          onToggle={() => setLive((v) => !v)}
        />
      </section>

      <section className="flex flex-wrap gap-2">
        <input
          className="btn min-w-[220px]"
          placeholder="Search market / bot / reason"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        {botId ? (
          <Link href="/trades" className="btn">
            Clear bot filter
          </Link>
        ) : null}
      </section>

      <section className="panel overflow-x-auto">
        <table>
          <thead>
            <tr>
              <SortTh label="Time" column="ts" sortKey={sort.sortKey} sortDir={sort.sortDir} onSort={sort.toggle} />
              <SortTh label="Bot" column="botName" sortKey={sort.sortKey} sortDir={sort.sortDir} onSort={sort.toggle} />
              <SortTh label="Side" column="side" sortKey={sort.sortKey} sortDir={sort.sortDir} onSort={sort.toggle} />
              <SortTh label="Market" column="title" sortKey={sort.sortKey} sortDir={sort.sortDir} onSort={sort.toggle} />
              <SortTh label="Px" column="price" sortKey={sort.sortKey} sortDir={sort.sortDir} onSort={sort.toggle} />
              <SortTh label="Size" column="sizeUsd" sortKey={sort.sortKey} sortDir={sort.sortDir} onSort={sort.toggle} />
              <SortTh label="Fee" column="feeUsd" sortKey={sort.sortKey} sortDir={sort.sortDir} onSort={sort.toggle} />
              <SortTh label="Realized" column="realizedPnl" sortKey={sort.sortKey} sortDir={sort.sortDir} onSort={sort.toggle} />
              <SortTh label="Reason" column="reason" sortKey={sort.sortKey} sortDir={sort.sortDir} onSort={sort.toggle} />
              <SortTh label="From" column="sourceWallet" sortKey={sort.sortKey} sortDir={sort.sortDir} onSort={sort.toggle} />
            </tr>
          </thead>
          <tbody>
            {sort.sorted.length === 0 ? (
              <tr>
                <td colSpan={10} className="text-[var(--muted)]">
                  No journal fills yet — run ticks with bots started
                </td>
              </tr>
            ) : (
              sort.sorted.map((f) => (
                <tr key={f.id}>
                  <td className="whitespace-nowrap font-mono text-[11px]">
                    {new Date(f.ts).toLocaleString()}
                  </td>
                  <td>
                    <Link
                      href={`/bots/${encodeURIComponent(f.botId)}`}
                      className="text-[var(--accent)]"
                    >
                      {f.botName}
                    </Link>
                    <div className="font-mono text-[10px] text-[var(--muted)]">
                      {f.family}
                    </div>
                  </td>
                  <td
                    className="font-mono text-xs"
                    style={{
                      color: f.side === "BUY" ? "var(--accent)" : "var(--danger)",
                    }}
                  >
                    {f.side}
                  </td>
                  <td>
                    <div className="max-w-xs truncate" title={f.title}>
                      {f.title}
                    </div>
                    <div className="font-mono text-[10px] text-[var(--muted)]">
                      {f.outcome}
                    </div>
                  </td>
                  <td className="stat">{f.price.toFixed(3)}</td>
                  <td className="stat">{money(f.sizeUsd)}</td>
                  <td className="stat text-[var(--muted)]">{money(f.feeUsd, 4)}</td>
                  <td className="stat" style={{ color: pnlColor(f.realizedPnl) }}>
                    {money(f.realizedPnl)}
                  </td>
                  <td
                    className="max-w-[12rem] truncate font-mono text-[11px] text-[var(--muted)]"
                    title={f.reason}
                  >
                    {f.reason}
                  </td>
                  <td
                    className="font-mono text-[11px] text-[var(--muted)]"
                    title={f.sourceWallet || ""}
                  >
                    {f.sourceWallet
                      ? `${f.sourceWallet.slice(0, 6)}…${f.sourceWallet.slice(-4)}`
                      : "—"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </section>
    </div>
  );
}

export default function TradesPage() {
  return (
    <Suspense fallback={<p className="text-[var(--muted)]">Loading journal…</p>}>
      <TradesInner />
    </Suspense>
  );
}
