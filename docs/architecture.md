# Architecture

This document describes the application as implemented in `src/`. It does not invent extra services.

## Application structure

The lab is a **Next.js 15 App Router** TypeScript app.

- **Server:** API routes under `src/app/api/*` call library modules. The paper engine, Polymarket client, and file/Blob store run on the server.
- **Browser:** Pages under `src/app/` are client components. They `fetch` only same-origin `/api/*` routes. There are no `NEXT_PUBLIC_*` secrets.
- **Shared types:** `src/lib/types.ts` defines `StrategyDef`, `BotState`, `PaperFill`, `RiskRules`, `LabState`, `STARTING_BANKROLL` (`1000`), and `DEFAULT_RULES`.

```text
src/
├── app/                 # pages + route handlers
├── components/          # SortableTable helpers
├── hooks/               # useLiveRefresh (10s poll)
└── lib/
    ├── polymarket/      # public Data API client
    ├── strategies/      # 100 strategy definitions
    ├── bots/            # tick runner, start/stop
    ├── paper/           # simulated broker
    ├── store/           # lab-state.json + journal + paths
    └── types.ts
```

## Data flow

The following diagram matches the tick path in `src/lib/bots/runner.ts` and persistence in `src/lib/store/`.

```text
Market Data
    ↓
Strategy
    ↓
Paper Execution
    ↓
State Storage
    ↓
Dashboard
```

Expanded:

```text
data-api.polymarket.com
  /v1/leaderboard   /trades   /trades?user=
           │
           ▼
  src/lib/polymarket/client.ts
           │
           ▼
  src/lib/bots/runner.ts
     ├─ getStrategy(catalog)
     ├─ selectWallets / walletIntent  (wallet_discovery)
     └─ propIntent                    (proprietary)
           │
           ▼
  src/lib/paper/broker.ts  (executeIntent, revalue)
           │
           ├─ src/lib/store          lab-state.json
           └─ src/lib/store/journal  trade-journal.jsonl
           │
           ▼
  src/app/api/*  ←  src/app pages (10s poll)
```

## Paper trading lifecycle

1. **Seed.** `defaultState()` creates one stopped bot per catalog strategy (`bot_${strategyId}`), each with `$1,000` cash/equity.
2. **Start.** `POST /api/bots` with `start`, `start_many`, or `stop_all` updates `BotState.status` via `setBotStatus` / `startMany` / `stopAllBots`.
3. **Tick.** `GET` or `POST /api/tick` calls `tickRunningBots()`. Bots with status `running` or `eligible_for_live` participate. `vercel.json` schedules GET `/api/tick` every minute on Vercel.
4. **Data.** The runner fetches boards (`fetchBoards(50)`) and a global tape (`fetchTrades(200)`). Wallet-discovery bots get a watched-wallet union and `fetchWatchedWalletTrades`.
5. **Mark.** Open positions are revalued from the latest global tape prices (`revalue`).
6. **Intents.** Each running bot may emit at most **3** wallet-copy fills or **2** proprietary fills per tick. Wallet-copy only considers prints newer than a 15-minute lookback / `copyCursorMs` watermark.
7. **Fill or skip.** `executeIntent` may return `null` (price skip band, insufficient cash, no position to sell, budget &lt; $1).
8. **Persist.** `writeStateAsync` updates `lab-state.json` (and Blob if configured). Each fill is also appended to the journal.
9. **Promote (paper only).** `maybePromote` may set `status` to `eligible_for_live`. That flag does not route live orders.

Bot statuses: `stopped` | `running` | `eligible_for_live` | `error`.

## Strategy layer

`src/lib/strategies/catalog.ts` exports `WALLET_STRATEGIES` (50), `PROP_STRATEGIES` (50), `ALL_STRATEGIES`, and `getStrategy(id)`.

Each `StrategyDef` has `id`, `name`, `family` (`wallet_discovery` | `proprietary`), `description`, and a `params` object. The catalog is a **registry of heuristics**, not a claim that any row is profitable.

The runner interprets params:

- **Wallet discovery:** `selectWallets` picks public `proxyWallet` addresses from day/week/month/all-time PnL and month-volume leaderboards (filters, ranks, intersections, scores). `walletIntent` copies, inverts, or filters those wallets’ recent trades.
- **Proprietary:** `propIntent` inspects the **global public tape** (price, size, title keywords, batch majority, inventory, etc.) and returns an intent or `null`.

Control strategies in the catalog include `random`, `always_buy`, and `always_sell`. They exist for comparison, not as recommended live systems.

Some catalog keys are **defined but unused by the runner** (verified by search): `sizeScale` on thin/broad wallet strategies; `mode: "fresh_only"` on `wd_33_fresh`. Documented here so readers do not assume those params change fill size or freshness.

## Simulation layer

`src/lib/paper/broker.ts`:

- Applies `skipPriceAbove` / `skipPriceBelow` before any fill.
- Adjusts price by `slippageBps` (buy +, sell −), clamped to `[0.01, 0.99]`.
- Caps spend at `min(maxUsdPerTrade, startingBankroll * maxPctBankroll / 100, cash * 0.95)`.
- Optionally charges a taker fee: `shares × feeRate × price × (1 − price)`, rounded to 5 decimals. `feeRateForTitle` maps title keywords to category rates (geopolitics 0, crypto 0.07, sports/econ 0.05, politics/finance/tech 0.04, else `defaultTakerFeeRate`).
- BUY opens/averages a position; SELL requires an existing position. Realized PnL is recorded on sells. Equity = cash + mark × shares. Max drawdown is tracked from peak equity.
- Keeps the last **500** fills per bot in memory (`FILL_HISTORY_LIMIT`) and journals every fill.

This is **not** an exchange matching engine. Fills are assumed at the modeled price.

## Storage / state layer

| Piece | Path / env | Role |
| --- | --- | --- |
| Lab state | `data/lab-state.json` or `LAB_STATE_FILE` | `LabState`: rules + all bots |
| Trade journal | `data/trade-journal.jsonl` or `LAB_JOURNAL_FILE` | Append-only fills (survives the 500-fill trim) |
| Data directory | `data/` or `LAB_DATA_DIR` | Repo-relative by default |
| Vercel temp | `VERCEL` set | State file defaults to OS tmp |
| Seed snapshot | `data/lab-state.json` in repo | Read on first Vercel boot if present |
| Blob | `BLOB_READ_WRITE_TOKEN` or `BLOB_STORE_ID` | Private `lab-state.json` object |

`src/lib/store/paths.ts` resolves the repo root by walking for `package.json` + `next.config.ts`. Paths are not tied to a developer home directory.

`normalize()` re-seeds any missing catalog bots and merges incoming rules onto `DEFAULT_RULES`.

## Polymarket integration layer

`src/lib/polymarket/client.ts` uses server `fetch` with `Accept: application/json` and `cache: "no-store"`:

| Function | Endpoint |
| --- | --- |
| `fetchLeaderboard` | `https://data-api.polymarket.com/v1/leaderboard?timePeriod=&orderBy=&limit=` |
| `fetchBoards` | DAY/WEEK/MONTH/ALL PnL + MONTH VOL in parallel |
| `fetchTrades` | `https://data-api.polymarket.com/trades?limit=` |
| `fetchWalletTrades` | `https://data-api.polymarket.com/trades?user=&limit=` |
| `fetchWatchedWalletTrades` | batched wallet fetches; failures become `[]` |

This is **read-only public data**. There is no CLOB order API, no L2 auth, and no signing.

## Frontend / UI relationship

| Route | Page file | API used |
| --- | --- | --- |
| `/` Overview | `src/app/page.tsx` | `GET /api/overview`; start/stop/tick via `/api/bots`, `/api/tick` |
| `/bots` | `src/app/bots/page.tsx` | `GET`/`POST /api/bots` |
| `/bots/[id]` | `src/app/bots/[id]/page.tsx` | `GET /api/bots/[id]`, `POST /api/bots` |
| `/trades` | `src/app/trades/page.tsx` | `GET /api/trades` |
| `/wallets` | `src/app/wallets/page.tsx` | `GET /api/wallets` |
| `/lab` | `src/app/lab/page.tsx` | `GET /api/lab` |
| `/rules` | `src/app/rules/page.tsx` | `GET`/`POST /api/rules` |

`useLiveRefresh` polls every **10 seconds** (`DASHBOARD_POLL_MS`). That is UI refresh only; paper ticks are separate (manual or cron ~60s).

### HTTP API (verified)

| Method | Path | Behavior |
| --- | --- | --- |
| GET/POST | `/api/tick` | `tickRunningBots()` → `{ ok, ticked, fills, errors }` |
| GET | `/api/bots` | Enriched bot list (no full fill/position arrays); optional `family`, `status` |
| POST | `/api/bots` | `start` / `stop` / `start_many` / `stop_all` |
| GET | `/api/bots/[id]` | Full bot including fills and strategy |
| GET | `/api/lab` | Raw `LabState` |
| GET | `/api/overview` | `{ updatedAt, totals, bots, rules }` (slim bots) |
| GET | `/api/rules` | Current `RiskRules` |
| POST | `/api/rules` | `patchRulesAsync(body)` — merges JSON onto rules |
| GET | `/api/trades` | Journal fills; `botId`, `limit` (max 2000) |
| GET | `/api/wallets` | Boards (limit 25) + trades (limit 40) |

None of these routes implement authentication.

### Known UI / API contract mismatches

Documented because they affect what learners see. Not fixed in the documentation task.

1. **Overview** expects `strategyCount`, `runningCount`, `eligibleCount`, `totalEquity`, `totalPnl`, `totalFees`, `totalRealized`, `totalUnrealized`, `totalTrades`, and `top`. `GET /api/overview` returns `totals` (`equity`, `realizedPnl`, `unrealizedPnl`, `feesPaid`, `netPnl`, `running`) and a slim `bots` array **without** strategy names or a `top` field. Cards can show “—” and the top table can be empty.
2. **Lab** expects `rows` and `winners`. `GET /api/lab` returns `{ updatedAt, rules, bots }`. The scoreboard can stay empty while state still contains bots. The page falls back to default gate numbers (7 days, 10 trades, 25% DD) when `rules` is missing from that expected shape.

Bots, bot detail, trades, wallets, and rules pages align more closely with their APIs.

## What this architecture is not

- Not a live Polymarket trading bot.
- Not a custody or signing wallet.
- Not an official Polymarket product.
- Not a guarantee that any strategy or leaderboard wallet will be profitable.
