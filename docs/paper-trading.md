# Paper Trading

## What paper trading means in this lab

**Paper trading** here is a **local (or hosted) simulation** of fills against **public Polymarket market data**.

Each of the 100 catalog strategies has its own `BotState`: virtual cash, positions, fees, equity, and a fill log. Starting bankroll is **$1,000** per bot (`STARTING_BANKROLL` in `src/lib/types.ts`). Bots do not share cash.

When a tick runs:

- The server reads public leaderboards and recent trades.
- Running strategies emit **intents** (market, side, price, reason).
- `executeIntent` in `src/lib/paper/broker.ts` **simulates** a fill or rejects the intent.
- Cash, positions, and PnL are updated in `lab-state.json`. Every accepted fill is appended to `data/trade-journal.jsonl`.

No request is sent to place an order on Polymarket. No user wallet is created or signed.

## Simulated execution

A paper fill is **not** a matched CLOB order. The broker:

1. Drops prices outside `skipPriceBelow`–`skipPriceAbove` (defaults 0.05–0.95).
2. Applies `slippageBps` (default 30) to the observed tape price.
3. Sizes the trade from `maxUsdPerTrade` (default $50), `maxPctBankroll` (default 5%), and 95% of remaining cash. Budget under $1 is skipped.
4. Optionally charges a **taker** fee using `C × rate × p × (1 − p)` and title-keyword category rates. Makers are free on Polymarket; this lab **assumes taker** fills when `chargeTakerFees` is true.
5. Updates average price on buys; computes realized PnL on sells; marks equity and max drawdown.

Per tick, the runner caps new fills at **3** (wallet-discovery) or **2** (proprietary). Wallet-copy ignores prints older than a **15-minute** lookback / cursor so it does not replay the same leader fills every tick.

In-memory fill history per bot is trimmed to **500**. The JSONL journal is the durable log.

## Difference from live trading

| Paper lab (this repo) | Live trading (not implemented) |
| --- | --- |
| Fills at modeled price ± slippage | Exchange matching, partials, rejects |
| Always “gets” the size if cash/rules allow | Liquidity, queue, and book depth matter |
| Public tape after the fact | You compete with other takers/makers |
| Tick/cron latency (manual or ~60s) | Milliseconds and cancellations |
| Keyword fee model | Venue fee schedule as actually billed |
| `eligible_for_live` is a **status string** | Would require a separate, unbuilt execution path |

**Paper trading does NOT guarantee live performance.**

A strategy that looks good in this journal can lose money live. A leaderboard wallet that this lab copies can stop working, be lucky, or be uncopyable at your size.

## What “eligible for live” actually does

`maybePromote` in `src/lib/bots/runner.ts` sets `status` to `eligible_for_live` when **all** of these hold:

- bot is `running` and has `runningSince`
- elapsed days ≥ `promotionDays` (default 7)
- `tradeCount` ≥ `minTradesForPromotion` (default 10)
- `maxDrawdown` ≤ `maxDrawdownPctForPromotion` (default 25)
- `equity` > `startingBankroll`

The runner still only paper-trades those bots. There is no live copy, no US/global order router, and no “promote to mainnet” button.

## How to run a paper session

1. `npm run dev` (see [getting-started.md](getting-started.md)).
2. Start bots from Overview or Bots (`POST /api/bots`).
3. Tick with **Tick now** or `GET`/`POST /api/tick`.
4. Inspect `/bots/[id]` and `/trades`.
5. Optionally change `/rules` (`POST /api/rules` merges the JSON body onto `RiskRules`).

If Overview totals or the Lab scoreboard look empty, that can be the **known API/UI mismatch** (Overview expects `top` / flattened counts; Lab expects `rows` / `winners`; the APIs return different shapes). Bots, trades, and wallet pages are the more reliable inspection surfaces today.

## Limitations (simulation)

- **Liquidity differences.** The broker does not simulate book depth, spreads beyond `slippageBps`, or being unable to complete a size.
- **Latency.** Strategies see a fetched snapshot, then act. They do not race the live tape.
- **Missing fills.** Intents return `null` for skip-band, cash, or missing positions. Wallet fetches that fail contribute no tape. Tick errors set that bot to `status: "error"`.
- **Market changes.** Leaderboards and markets move; copied wallets change; titles used for fee/category filters are heuristic.
- **API failures.** `fetch` errors throw (`Polymarket HTTP ${status}`) and can fail a whole tick or mark individual bots. Per-wallet errors are swallowed as empty tapes.
- **No settlement model.** Positions are marked from later tape prints. There is no explicit market-resolution / redemption engine in this tree.
- **Incomplete param wiring.** Some catalog fields (for example `sizeScale`, `fresh_only`) do not change runner behavior.

## Risks

Studying this lab does not remove market risk. If you later trade for real (outside this repository):

- You can lose the entire bankroll.
- Fees, slippage, and adverse selection are usually worse than a friendly simulator.
- Public leaderboard “winners” are not a certified edge.
- Past or paper PnL is not a forecast.

This project is educational. It is not investment advice and is not an official Polymarket product.

## Related

- [architecture.md](architecture.md) — tick and storage details
- [risk-management.md](risk-management.md) — implemented rules vs gaps
- [DISCLAIMER.md](../DISCLAIMER.md)
