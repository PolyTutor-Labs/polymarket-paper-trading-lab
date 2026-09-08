# Getting Started

Run this lab as a **local paper-trading study environment**. You do not need Polymarket API keys, wallets, or secrets for the default local path.

## Requirements

Verified from `package.json`, Next.js 15 usage, and the secret-scan test:

- **Node.js** compatible with Next.js 15 (the lockfile’s Tailwind Oxide packages declare `node >= 20`; use a current Node 20 LTS if unsure)
- **npm** (lockfile is `package-lock.json`)
- **Python 3** only if you run `scripts/security/check_secrets.py` (the Vitest secret-scan gate calls `python3`)

Network access is required for:

- `npm install` (npm registry)
- paper ticks and the Wallets page (`https://data-api.polymarket.com`)

No Polymarket account is required to read those public endpoints.

## Installation

From the repository root (any clone; paths are repo-relative):

```bash
npm install
```

## Environment setup

```bash
cp .env.example .env.local
```

Copying is **optional**. Local paper trading works with no environment variables set.

`.env.example` documents the values the app actually reads:

| Variable | Required | Purpose |
| --- | --- | --- |
| `LAB_DATA_DIR` | No | Directory for `lab-state.json` and `trade-journal.jsonl`. Default: `data` (repo-relative) |
| `LAB_STATE_FILE` | No | Override path for lab state |
| `LAB_JOURNAL_FILE` | No | Override path for the JSONL journal |
| `BLOB_READ_WRITE_TOKEN` | No | Vercel Blob write token for hosted `lab-state.json` |
| `BLOB_STORE_ID` | No | Alternative Blob enable flag |
| `VERCEL` | Set by Vercel | Switches default state file to the OS temp dir |

Do not commit `.env`, `.env.local`, or real token values. There are no `NEXT_PUBLIC_*` secrets.

On first local read, if no state file exists, the store writes a default `LabState` (100 stopped bots) under the data directory.

## Development server

```bash
npm run dev
```

This runs `next dev --turbopack`. Open the URL Next.js prints (typically `http://localhost:3000`).

Suggested first clicks:

1. **Bots** — start a small set or “Start all 100”.
2. **Overview** or Bots — **Tick now** (POST `/api/tick`) after bots are running.
3. **Trades** / a bot’s **Review** page — inspect paper fills.
4. **Wallets** — public leaderboards and recent tape (needs the Data API).
5. **Rules** — inspect default risk/fee/promotion numbers.

See [paper-trading.md](paper-trading.md) for what those clicks do and do not mean.

## Available commands

From `package.json` `scripts`:

| Command | Script | Purpose |
| --- | --- | --- |
| `npm run dev` | `next dev --turbopack` | Local development server |
| `npm run build` | `next build --turbopack` | Production build |
| `npm run start` | `next start` | Serve a production build |
| `npm run lint` | `eslint .` | Lint |
| `npm run typecheck` | `tsc --noEmit` | TypeScript check |
| `npm test` | `vitest run` | Unit tests |

## Testing commands

```bash
npm test
npm run typecheck
npm run lint
```

Tests live in `tests/**/*.test.ts` (catalog size, broker fees/fills, default store, path overrides, dashboard number helpers, secret-scan gate).

Secret scan (also invoked by `tests/secret-scan.test.ts` via `python3`):

```bash
python scripts/security/check_secrets.py
```

If `python` is not on your PATH, use `python3` the same way the test does.

## Build commands

```bash
npm run build
npm run start
```

`next.config.ts` sets `outputFileTracingRoot` to this repository root so traces are not bound to a machine-specific launch directory.

## Hosted / cron note

`vercel.json` registers a cron: GET `/api/tick` on `* * * * *` (every minute) when the app is deployed on Vercel. Locally, ticks run only when you call `/api/tick` (UI **Tick now** or HTTP GET/POST).

Mutating APIs are unauthenticated. Treat a public URL as an open lab console, not a secured trading system. See [SECURITY.md](../SECURITY.md) and [risk-management.md](risk-management.md).
