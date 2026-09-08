# polymarket-paper-trading-lab

> PolyTutor Labs · Intermediate · Paper Trading / Simulation

Paper-trading lab racing ~100 bots ($1,000 each) across wallet-discovery and proprietary strategies on Polymarket public data.

## Local setup

Works from any clone. Paths are repository-relative (or env overrides) — not tied to a developer machine.

```bash
npm install
cp .env.example .env.local   # optional; defaults are enough for local paper trading
npm run dev
```

Runtime files are written under `./data` (override with `LAB_DATA_DIR`). That directory is gitignored.

Environment variables the app actually reads are listed in `.env.example`. `package.json` scripts (`dev` / `build` / `start` / `lint`) have no machine-specific paths.

## Project History & Attribution

This PolyTutor Labs project is based on an existing open-source Polymarket-related codebase and has been reorganized for educational use.

Original project: https://github.com/ugcrocky-dev/polymarket-paper-lab

PolyTutor Labs work includes repository organization and security audit packaging. Upstream git history is intentionally not retained.

## Security

See `SECURITY_AUDIT.md` (CLEAN malicious-code audit).

## Disclaimer

Educational / research use only. Not financial advice. Paper simulation is not live trading.
