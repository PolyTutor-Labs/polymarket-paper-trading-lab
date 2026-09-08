# Task 6 — Repository Structure Organization Report

## 1. Repository summary

Original repository: https://github.com/ugcrocky-dev/polymarket-paper-lab  
Target PolyTutor name: PolyTutor-Labs/polymarket-paper-trading-lab  
Purpose: Next.js paper-trading lab that races ~100 bots ($1,000 each) across wallet-discovery and proprietary strategies on Polymarket public data, with a dashboard for overview, wallets, bots, lab scoreboard, rules, and trades.

## 2. Structure changes

| Old path | New path | Reason |
|----------|----------|--------|
| `.tmp-lock/` | *(removed)* | Temporary leftover base64 lock fragments from prior “temp: lock” commits; not application code |
| `docs/superpowers/plans/` | `docs/plans/` | Remove tooling-specific `superpowers` nesting; clearer PolyTutor docs layout |
| `docs/superpowers/specs/` | `docs/specs/` | Same as above for design specs |

**Kept as-is (intentional):** Next.js root configs, `public/`, and `src/` (`app/`, `components/`, `hooks/`, `lib/{bots,paper,polymarket,store,strategies}`). This is the natural App Router layout; paper/simulation/strategy code already lives under `src/lib/` and was not relocated to invent empty top-level `strategies/`, `simulation/`, `backtests/`, `experiments/`, `data/`, `results/`, `scripts/`, `tests/`, `config/`, or `examples/` folders.

## 3. New repository tree

```text
polymarket-paper-trading-lab/
├── README.md
├── TASK_REPORT.md
├── package.json
├── package-lock.json
├── next.config.ts
├── next-env.d.ts
├── tsconfig.json
├── eslint.config.mjs
├── postcss.config.mjs
├── vercel.json
├── .gitignore
├── docs/
│   ├── plans/
│   └── specs/
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

## 4. Files moved

| File | Old location | New location |
|------|--------------|--------------|
| `2026-09-06-polymarket-paper-lab.md` | `docs/superpowers/plans/` | `docs/plans/` |
| `2026-09-06-polymarket-paper-lab-design.md` | `docs/superpowers/specs/` | `docs/specs/` |

## 5. Files deleted

| File | Reason |
|------|--------|
| `.tmp-lock/part0.b64` | Temporary leftover; not used by the app |
| `.tmp-lock/part1.b64` | Temporary leftover; not used by the app |

## 6. Functional impact

Trading logic changed: NO  
Simulation logic changed: NO  
Strategy behavior changed: NO  
Dependencies changed: NO

## 7. Validation

Import/reference checks: PASS (no code or config referenced `docs/superpowers` or `.tmp-lock`; `@/*` → `./src/*` unchanged)  
Tests: NOT RUN  
Build: NOT RUN

## 8. Git

Commit message: `refactor: organize repository structure for PolyTutor`  
Branch: `polytutor/organize-structure`  
Commit hash: use `git rev-parse HEAD` on this branch (tip includes this report)  
Working tree clean: YES  
Pushed: NO
