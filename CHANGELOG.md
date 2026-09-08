# Changelog

All notable public-release changes to this PolyTutor Labs educational packaging
are recorded here.

This project is a paper-trading **learning resource**. Entries describe
repository and documentation work only. They do not claim profitability,
production trading success, or guaranteed results.

## [0.1.0] — 2026-09-08

First PolyTutor Labs public educational release of
`polymarket-paper-trading-lab` (version `0.1.0`).

The application remains a local / hosted **paper simulation** on public
Polymarket data. There is no live order routing in this release.

### PolyTutor transformation

- Educational packaging of the existing open-source paper lab
  ([ugcrocky-dev/polymarket-paper-lab](https://github.com/ugcrocky-dev/polymarket-paper-lab)).
- Attribution, disclaimer, and “paper ≠ live” framing added for public learners.
- Upstream git history is intentionally not retained in this packaging.

### Organization

- Repository layout cleaned for study: Next.js App Router under `src/`,
  historical notes under `docs/plans/` and `docs/specs/`.
- Temporary transfer leftovers (for example `.tmp-lock`) removed from `HEAD`.

### Portability

- Runtime paths resolve from the repository root (or `LAB_*` env overrides).
- Local paper trading is not tied to a developer machine home directory.
- `next.config.ts` traces from this repository root.

### Security

- `SECURITY.md` policy and private advisory reporting path.
- `SECURITY_AUDIT.md` records a CLEAN malicious-code / supply-chain review
  (trading and strategy logic were not modified for that audit).
- `.env*` gitignored except `.env.example` placeholders.
- `python scripts/security/check_secrets.py` plus a Vitest quality gate.

### Testing

- Vitest unit tests for catalog, paper broker, store, paths, helpers, and
  the secret scan.
- `npm run typecheck`, `npm run lint`, `npm test`, and `npm run build`
  available as public quality commands.

### Documentation

- Learner docs: getting started, architecture, paper trading, learning path,
  and risk management.
- `CONTRIBUTING.md` and `DISCLAIMER.md`.
- Known dashboard contract mismatches for `/api/overview` and `/api/lab`
  remain **documented, not fixed**.

### Release packaging

- `package.json` metadata aligned with the public GitHub repository.
- This changelog and a license / attribution file for the public tree.
