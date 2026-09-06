export type LeaderRow = {
  rank: string;
  proxyWallet: string;
  userName: string;
  vol: number;
  pnl: number;
};

export type TradeRow = {
  proxyWallet: string;
  side: "BUY" | "SELL";
  size: number;
  price: number;
  timestamp: number;
  title: string;
  slug: string;
  outcome: string;
};

async function getJson<T>(url: string): Promise<T> {
  const res = await fetch(url, {
    headers: { Accept: "application/json" },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Polymarket HTTP ${res.status}`);
  return (await res.json()) as T;
}

export async function fetchLeaderboard(
  timePeriod: "DAY" | "WEEK" | "MONTH" | "ALL",
  orderBy: "PNL" | "VOL" = "PNL",
  limit = 50
) {
  return getJson<LeaderRow[]>(
    `https://data-api.polymarket.com/v1/leaderboard?timePeriod=${timePeriod}&orderBy=${orderBy}&limit=${limit}`
  );
}

export async function fetchBoards(limit = 50) {
  const [day, week, month, all, monthVol] = await Promise.all([
    fetchLeaderboard("DAY", "PNL", limit),
    fetchLeaderboard("WEEK", "PNL", limit),
    fetchLeaderboard("MONTH", "PNL", limit),
    fetchLeaderboard("ALL", "PNL", limit),
    fetchLeaderboard("MONTH", "VOL", limit),
  ]);
  return { day, week, month, all, monthVol };
}

export async function fetchTrades(limit = 100) {
  return getJson<TradeRow[]>(`https://data-api.polymarket.com/trades?limit=${limit}`);
}

/** Recent fills for one leaderboard wallet (proxy address). */
export async function fetchWalletTrades(proxyWallet: string, limit = 25) {
  const user = encodeURIComponent(proxyWallet.toLowerCase());
  return getJson<TradeRow[]>(
    `https://data-api.polymarket.com/trades?user=${user}&limit=${limit}`
  );
}

/** Batch-fetch wallet tapes with a small concurrency limit. */
export async function fetchWatchedWalletTrades(
  wallets: string[],
  limitPerWallet = 20,
  concurrency = 6
): Promise<TradeRow[]> {
  const unique = [...new Set(wallets.map((w) => w.toLowerCase()).filter(Boolean))];
  const out: TradeRow[] = [];
  for (let i = 0; i < unique.length; i += concurrency) {
    const chunk = unique.slice(i, i + concurrency);
    const parts = await Promise.all(
      chunk.map(async (w) => {
        try {
          return await fetchWalletTrades(w, limitPerWallet);
        } catch {
          return [] as TradeRow[];
        }
      })
    );
    for (const rows of parts) out.push(...rows);
  }
  out.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
  return out;
}
