# Risk Management

This file separates **what the code actually implements** from **model/market limitations** and from **future ideas**. Future ideas are not present in the engine today.

Paper controls are **research knobs**. They do not make trading safe or profitable.

## Implemented

Verified in `src/lib/types.ts` (`DEFAULT_RULES`), `src/lib/paper/broker.ts`, `src/lib/bots/runner.ts`, `src/lib/store/`, and `SECURITY.md`.

### Isolated paper bankrolls

- Each bot starts with `STARTING_BANKROLL` = `1000`.
- Bots do not share cash or positions.
- Spend is capped by `maxUsdPerTrade` (default `50`), `maxPctBankroll` (default `5` percent of **starting** bankroll), and `cash * 0.95`.

### Price and slippage model

- Intents with price `>` `skipPriceAbove` (default `0.95`) or `<` `skipPriceBelow` (default `0.05`) are rejected.
- Fill price = tape price ± `slippageBps` / 10000 (default `30` bps), clamped to `[0.01, 0.99]`.

### Fee model

- `chargeTakerFees` (default `true`) enables `calcTakerFee`.
- Category rate from market title keywords; otherwise `defaultTakerFeeRate` (default `0.05`).
- Formula documented in code: `C × feeRate × p × (1 − p)`, rounded to 5 decimals.

### Tick and copy limits

- Wallet-discovery: at most 3 fills per bot per tick; 15-minute lookback / `copyCursorMs` watermark.
- Proprietary: at most 2 fills per bot per tick.
- In-memory fills trimmed to 500; journal still appends every fill.

### Paper promotion gate

`maybePromote` may set `eligible_for_live` when days, trade count, max drawdown, and equity-above-start all pass (`promotionDays` 7, `minTradesForPromotion` 10, `maxDrawdownPctForPromotion` 25 by default).

This is a **status flag only**. It does not place live orders.

### Persistence and path safety

- Default state/journal under repo `data/` (gitignored).
- Overrides: `LAB_DATA_DIR`, `LAB_STATE_FILE`, `LAB_JOURNAL_FILE`.
- Optional private Vercel Blob for `lab-state.json`.
- No `NEXT_PUBLIC_*` secrets; browser calls same-origin `/api/*` only.

### Repository safeguards

- `.env*` gitignored except `.env.example` placeholders.
- `python scripts/security/check_secrets.py` (also `npm test` via `tests/secret-scan.test.ts`).
- Security policy: [SECURITY.md](../SECURITY.md).
- Static malware/supply-chain review: [SECURITY_AUDIT.md](../SECURITY_AUDIT.md) (CLEAN; trading logic not modified).

### No live custody

The lab does not hold user keys, sign transactions, or call a live order API. “Wallet” means a public leaderboard `proxyWallet`.

## Limitations

### Paper / live differences

- Assumed fills vs real matching, cancels, and partials.
- No order-book depth; size always “works” if cash/rules allow.
- Tick cadence (manual or ~60s cron) vs continuous live markets.
- `eligible_for_live` does not equal “safe to trade live.”

### Model assumptions

- Title-keyword fee and category filters can misclassify markets.
- Marks come from later public prints, not a full book or official settlement.
- Some catalog params (`sizeScale`, `fresh_only`) do not affect the runner.
- `winCount` increments on any sell with `pnl > 0`; win rate on the Lab UI is `winCount / tradeCount` only if that UI were wired to computed rows (see contract mismatch).

### Market conditions

- Leaderboards and tapes change; copied wallets can stop trading or reverse.
- Public APIs can rate-limit, error, or return stale/incomplete data.
- Keyword “crypto / sports / politics” filters are not official taxonomy.

### Execution differences

- Wallet-copy uses a short lookback; it is not a full historical replay engine.
- Proprietary strategies consume a **global** recent tape (`fetchTrades(200)`), not a chosen book.
- Per-wallet fetch failures become empty arrays (silent skip).
- Unhandled errors in a bot’s tick set `status` to `error` and skip that bot.

### Operational / API security

From `SECURITY_AUDIT.md` (still true in the current routes):

- `POST /api/bots`, `POST /api/rules`, and GET/POST `/api/tick` are **unauthenticated**.
- `GET /api/lab` returns full `LabState`; `GET /api/trades` returns journal rows.
- Anyone who can reach a deployed instance can start bots or overwrite rules.

### Dashboard accuracy

- Overview and Lab pages do not currently consume the same JSON shape their APIs return. Treat Bots / bot detail / Trades / stored JSON as the source of truth for paper results until that contract is aligned (out of scope for this documentation task).

### Lockfile note

`SECURITY_AUDIT.md` records `package.json` requesting `next@^15.5.25` while the lockfile may resolve an older 15.x. That is a dependency-pin issue, not a paper-risk control. Not changed here.

## Recommended improvements

**Future ideas — not implemented.** Clearly labeled so they are not mistaken for features.

- Authenticate or secret-gate mutating routes (`/api/tick`, `/api/bots`, `/api/rules`) before any public deploy.
- Align `/api/overview` and `/api/lab` response shapes with the Overview and Lab pages (or change the pages to the existing payloads).
- Wire unused catalog params or remove them so the registry matches the runner.
- Model book depth, reject probability, and latency — still paper, still not a live guarantee.
- Add market resolution / redemption instead of tape-only marks.
- Pin Next.js to a patched release in the lockfile (audit follow-up).
- Narrow `GET /api/lab` if the dashboard is ever public.

None of these items would turn paper results into a promise of live profit.
