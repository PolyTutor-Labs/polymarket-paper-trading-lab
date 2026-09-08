# Learning Path

Use this repository as a **study sequence**, not as a profit playbook. None of the catalog strategies are presented as guaranteed or recommended live methods. Control rows (`random`, `always_buy`, `always_sell`) exist so you can compare heuristics against naive baselines.

## Stage 1 — Understand Polymarket concepts

Before changing code, make sure these public-market ideas are clear:

- Binary (or multi-outcome) contracts with prices typically in `(0, 1)`.
- **Taker** vs maker: this lab always models taker-style fills when fees are on.
- **Leaderboards** rank public `proxyWallet` addresses by PnL or volume over DAY / WEEK / MONTH / ALL.
- **Tape** is a stream of public prints (`side`, `price`, `size`, `title`, `slug`, `outcome`).

Then open **Wallets** (`/wallets` → `GET /api/wallets`) and look at real boards and recent trades. That page only displays public data; it does not trade.

Suggested reading in-repo: fee comment on `RiskRules` in `src/lib/types.ts`, and `feeRateForTitle` in `src/lib/paper/broker.ts`.

## Stage 2 — Understand repository architecture

Read [architecture.md](architecture.md) and walk the folders:

1. `src/lib/polymarket/client.ts` — what is fetched and from where.
2. `src/lib/types.ts` — `BotState`, `RiskRules`, `LabState`.
3. `src/lib/store/` — where state lives and how paths resolve.
4. `src/app/api/` — how the dashboard talks to the engine.

Goal: you can explain “public data in, paper state out” without assuming a hidden live broker.

## Stage 3 — Study paper execution

Read [paper-trading.md](paper-trading.md), then:

1. `executeIntent` and `revalue` in `src/lib/paper/broker.ts`.
2. `tickRunningBots` and `maybePromote` in `src/lib/bots/runner.ts`.
3. Tests in `tests/broker.test.ts` (skip band, fee formula, buy/sell).

Run a local session ([getting-started.md](getting-started.md)): start one bot, tick, open `/bots/[id]` and `/trades`.

Ask:

- Why did this intent become a fill or `null`?
- How did slippage and fees change cash vs equity?
- Why might Overview or Lab look empty even after fills? (documented API/UI mismatch)

Paper results are **not** a forecast of live results.

## Stage 4 — Study strategies

Open `src/lib/strategies/catalog.ts` (50 wallet-discovery + 50 proprietary).

Then read how the runner **interprets** those params:

- `selectWallets` / `walletIntent` — copy or fade public leader wallets.
- `propIntent` — tape heuristics (fade longshots, follow size, category keywords, inventory caps, controls).

Study questions (research, not alpha claims):

- Which params are actually read? (`sizeScale` and `fresh_only` are catalog-only today.)
- How does a 15-minute copy cursor change “copy trading” vs replaying history?
- What does a **control** strategy imply for interpreting other bots’ paper PnL?

Do **not** treat leaderboard copy as “smart money you should follow with real funds.” Leaderboards are public, survivorship-prone, and not sized to your bankroll.

## Stage 5 — Experiment safely

Safe experiments stay **inside paper state**:

- Change Rules in the UI (`POST /api/rules`) and tick again.
- Start only one family (`wallet_discovery` or `proprietary`).
- Point `LAB_DATA_DIR` at a throwaway directory so you do not mix journals.
- Add tests next to `tests/*.test.ts` when you change documented behavior.

Unsafe or out of scope for this educational lab:

- Adding private keys, live order clients, or “guaranteed profit” copy.
- Deploying an unauthenticated tick/rules API on a public URL and treating it as secure.
- Claiming a paper winner is ready for live capital because `eligible_for_live` flipped.

If you extend the project, follow [CONTRIBUTING.md](../CONTRIBUTING.md) and keep [DISCLAIMER.md](../DISCLAIMER.md) intact.

## Suggested file order

| Order | File | Why |
| --- | --- | --- |
| 1 | `src/lib/types.ts` | Domain model |
| 2 | `src/lib/polymarket/client.ts` | External data |
| 3 | `src/lib/paper/broker.ts` | Simulation |
| 4 | `src/lib/bots/runner.ts` | Lifecycle |
| 5 | `src/lib/strategies/catalog.ts` | Hypothesis registry |
| 6 | `src/lib/store/index.ts` | Persistence |
| 7 | `src/app/api/*` then `src/app/*/page.tsx` | Contract vs UI |

## What this path does not teach

- How to make money on Polymarket.
- That any strategy, wallet, or promotion gate is validated for live trading.
- Official Polymarket operations or support procedures.
