# Polymarket Paper Trading Lab

**Version:** [v0.1.0](CHANGELOG.md)

An educational Polymarket paper trading laboratory for studying strategy evaluation, simulation, and trading system architecture.

This repository is a **learning resource**, not a live trading product. It lets you inspect how a paper desk selects public market data, turns strategy rules into simulated fills, and stores results for review.

## PolyTutor Labs

This project is maintained by **PolyTutor Labs** as an educational packaging of an existing open-source paper lab.

PolyTutor work on this repository includes:

- repository organization
- portability (repository-relative paths)
- security hardening and a published security audit
- test and quality-gate stabilization
- educational documentation
- public-release packaging (changelog, license, metadata)

The original application code was not authored from scratch here. See [Attribution](#attribution).

This lab is **not affiliated with Polymarket**. It reads public Polymarket data APIs only.

## About This Project

The app is a Next.js paper-trading desk that registers **100 strategies** (50 wallet-discovery, 50 proprietary), each with an isolated **$1,000** virtual bankroll.

On each tick the server:

1. Fetches public Polymarket leaderboards and recent trades.
2. Lets running strategies emit buy/sell **intents**.
3. Executes those intents in a **paper broker** (cash, positions, fees, slippage).
4. Writes lab state and an append-only trade journal.
5. Serves a dashboard over same-origin `/api/*` routes.

There is **no live order routing**, no wallet custody, and no private-key handling. “Wallet” in this codebase means a **public Polymarket proxy address** on a leaderboard.

`eligible_for_live` is only a **paper status flag**. Meeting the promotion gate does not place live trades.

## What You Will Learn

- How a paper trading loop is structured: data → strategy → simulated execution → persistence → UI.
- How wallet-discovery strategies select public leaderboard addresses and copy recent tape.
- How proprietary strategies turn public prints into heuristic intents (follow, fade, size filters, controls).
- How simulated fills apply skip bands, slippage, size caps, and a taker-fee model.
- How risk rules and a promotion gate are stored and applied in software — as **research controls**, not as proof of profitability.
- How an educational lab separates public market data from local simulation state.

This project does **not** teach a profitable trading method and does **not** provide investment advice.

## Features

Verified in the current tree:

- 100 registered strategies (50 `wallet_discovery` + 50 `proprietary`) in `src/lib/strategies/catalog.ts`
- Isolated `$1,000` paper bankroll per bot (`STARTING_BANKROLL`)
- Paper broker with skip-price band, slippage (bps), per-trade size caps, and optional taker fees
- Bot runner with start/stop, per-tick fill caps, wallet-copy lookback, and a paper promotion flag
- Local JSON lab state plus an append-only `trade-journal.jsonl`
- Optional Vercel Blob persistence (`BLOB_READ_WRITE_TOKEN` / `BLOB_STORE_ID`)
- Dashboard pages: Overview, Bots, Trades, Wallets, Lab, Rules
- Public Polymarket Data API client (leaderboards and trades)
- Vitest unit tests, ESLint, TypeScript check, and a Python secret scan

Known UI/API gaps (documented, not fixed in v0.1.0) are listed under [Risks and Limitations](#risks-and-limitations).

## Architecture Overview

```text
Polymarket public data
        ↓
Strategy intents
        ↓
Paper execution
        ↓
State storage
        ↓
Dashboard
```

| Layer | Location | Responsibility |
| --- | --- | --- |
| Polymarket integration | `src/lib/polymarket/` | Server-side `fetch` to `https://data-api.polymarket.com` (leaderboards, global trades, per-wallet trades) |
| Strategy catalog | `src/lib/strategies/` | 100 strategy definitions (`id`, family, params). No live execution. |
| Bot runner | `src/lib/bots/` | Tick loop: select wallets, build intents, call the broker, maybe promote |
| Paper broker | `src/lib/paper/` | Simulated fills; updates cash, positions, fees, equity, drawdown |
| Storage | `src/lib/store/` | `lab-state.json`, `trade-journal.jsonl`, optional Blob |
| HTTP API | `src/app/api/` | Same-origin JSON routes used by the dashboard |
| UI | `src/app/`, `src/components/`, `src/hooks/` | Client pages that poll `/api/*` |

Details: [docs/architecture.md](docs/architecture.md).

## Repository Structure

```text
polymarket-paper-trading-lab/
├── README.md
├── CHANGELOG.md
├── LICENSE
├── CONTRIBUTING.md
├── DISCLAIMER.md
├── SECURITY.md
├── SECURITY_AUDIT.md
├── package.json
├── .env.example
├── docs/
│   ├── architecture.md
│   ├── getting-started.md
│   ├── paper-trading.md
│   ├── learning-path.md
│   ├── risk-management.md
│   ├── plans/                  # historical implementation notes
│   └── specs/                  # historical design notes
├── scripts/security/
│   └── check_secrets.py
├── tests/
├── public/
└── src/
    ├── app/          # App Router pages + API routes
    ├── components/
    ├── hooks/
    └── lib/
        ├── bots/
        ├── paper/
        ├── polymarket/
        ├── store/
        ├── strategies/
        └── types.ts
```

Runtime files are written under `./data` (gitignored) unless you override `LAB_DATA_DIR`.

## Getting Started

Requirements: Node.js (this app is Next.js 15) and npm. Python 3 is needed only for the secret-scan script.

```bash
npm install
cp .env.example .env.local   # optional; defaults are enough for local paper trading
npm run dev
```

Then open the Next.js dev server (default `http://localhost:3000`).

Full setup, environment variables, and commands: [docs/getting-started.md](docs/getting-started.md).

## Paper Trading Workflow

1. Start the dev server.
2. On Overview or Bots, start some or all bots (`start_many` / per-bot start).
3. Run a tick (`Tick now` posts `/api/tick`, or GET/POST `/api/tick`). On Vercel, `vercel.json` also schedules GET `/api/tick` every minute.
4. Review fills on Bots / bot detail / Trades. Adjust paper rules on Rules.
5. Lab page is meant to rank bots and show the promotion gate — see the known contract mismatch below.

Paper trading does **not** guarantee live performance. See [docs/paper-trading.md](docs/paper-trading.md).

## Testing

Commands from `package.json` and the security docs:

```bash
npm test
npm run typecheck
npm run lint
python scripts/security/check_secrets.py
```

Vitest runs files matching `tests/**/*.test.ts` (catalog, broker, store, paths, dashboard helpers, secret scan).

## Documentation

| Document | Topic |
| --- | --- |
| [docs/getting-started.md](docs/getting-started.md) | Install, env, commands |
| [docs/architecture.md](docs/architecture.md) | Layers, data flow, APIs, UI |
| [docs/paper-trading.md](docs/paper-trading.md) | What paper trading means here |
| [docs/learning-path.md](docs/learning-path.md) | Suggested study order |
| [docs/risk-management.md](docs/risk-management.md) | Implemented controls vs limitations |
| [SECURITY.md](SECURITY.md) | Secrets policy and reporting |
| [SECURITY_AUDIT.md](SECURITY_AUDIT.md) | CLEAN malicious-code audit (2026-09-08) |
| [CHANGELOG.md](CHANGELOG.md) | Version history (v0.1.0) |
| [LICENSE](LICENSE) | MIT license and attribution |
| [CONTRIBUTING.md](CONTRIBUTING.md) | What contributions are accepted |
| [DISCLAIMER.md](DISCLAIMER.md) | Educational-use disclaimer |
| [docs/specs/2026-09-06-polymarket-paper-lab-design.md](docs/specs/2026-09-06-polymarket-paper-lab-design.md) | Historical design spec |
| [docs/plans/2026-09-06-polymarket-paper-lab.md](docs/plans/2026-09-06-polymarket-paper-lab.md) | Historical implementation plan |

## Risks and Limitations

- **Paper ≠ live.** Simulated fills use observed public tape price ± configured slippage. There is no CLOB matching, no guaranteed liquidity, and no live order placement.
- **Promotion is not live trading.** `eligible_for_live` is a status on `BotState` after days / trade count / drawdown / equity checks. The runner never submits exchange orders.
- **Market and API risk.** Leaderboard and trade fetches can fail, lag, or return incomplete tape. Per-wallet fetches that error are treated as empty lists.
- **Model assumptions.** Fee category is inferred from market-title keywords. Some catalog params (for example `sizeScale`, `fresh_only`) are stored on strategy definitions but are not consumed by the runner.
- **Unauthenticated APIs.** Mutating routes (`POST /api/bots`, `POST /api/rules`, GET/POST `/api/tick`) have no auth. Do not expose a public deploy as if it were a locked trading desk. Details: [SECURITY_AUDIT.md](SECURITY_AUDIT.md).
- **Known dashboard contract mismatches (documented, not fixed):**
  - Overview (`/`) expects `/api/overview` fields such as `strategyCount`, `runningCount`, `top`. The route currently returns `{ updatedAt, totals, bots, rules }`. Summary cards and the “Top paper bots” table may stay empty.
  - Lab (`/lab`) expects `{ rows, winners, rules }`. `GET /api/lab` currently returns raw `LabState` (`updatedAt`, `rules`, `bots`). The scoreboard table may stay empty even when bots exist.

## Security

See [SECURITY.md](SECURITY.md). Local paper trading needs no secrets. Do not commit `.env.local`, Blob tokens, or any wallet keys.

```bash
python scripts/security/check_secrets.py
```

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md). Documentation, tests, educational improvements, research notes, and bug fixes are welcome. Do not add secrets, private keys, or claims of guaranteed profit.

## Disclaimer

Educational and research use only. Trading involves risk. Historical or simulated performance does not guarantee future results. Paper trading differs from live trading.

Full text: [DISCLAIMER.md](DISCLAIMER.md).

## Attribution

Original repository:

https://github.com/ugcrocky-dev/polymarket-paper-lab

PolyTutor Labs contributions are organization, portability, security improvements, testing improvements, educational documentation, and public-release packaging. This project does **not** claim ownership of the original application code. Upstream git history is intentionally not retained in this fork packaging.
