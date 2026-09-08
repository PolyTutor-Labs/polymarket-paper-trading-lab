# Polymarket Paper Lab

Paper-trading lab racing 100 bots ($1,000 each) across wallet-discovery and proprietary strategies.

## Local setup

Works from any clone. Paths are repository-relative (or env overrides) — not tied to a developer machine.

```bash
npm install
cp .env.example .env.local   # optional; defaults are enough for local paper trading
npm run dev
```

Runtime files are written under `./data` (override with `LAB_DATA_DIR`). That directory is gitignored.

Environment variables the app actually reads are listed in `.env.example`.

## Permanent URL

Deployed on Vercel (see production domain after first deploy).
