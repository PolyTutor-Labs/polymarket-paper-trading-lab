# Polymarket Paper Lab — Design Spec

**Date:** 2026-09-06  
**Status:** Approved (user: bankroll $1000 each bot, build it)

## Goal

Paper-trade 100 strategies on global Polymarket public data for ≥7 continuous days, rank winners on a dashboard, and only then consider live copy on Polymarket US.

## Constraints

- Isolated virtual bankroll: **$1,000 per bot**
- Semi-auto rules: max size, skip extreme prices, lag/slippage model
- Live Polymarket US execution: **out of v1**
- No claim of “always profitable” wallets

## Architecture

1. **Data collector** — Polymarket public leaderboard + trades + markets APIs  
2. **Strategy registry** — 50 wallet-discovery + 50 proprietary, all runnable  
3. **Paper broker** — per-bot cash/positions/fills at observed price ± slippage  
4. **Bot runner** — start/stop, tick loop, 7-day promotion gate  
5. **Dashboard** — Overview, Wallets, Bots, Lab scoreboard, Rules

## Promotion gate

A bot becomes `eligible_for_live` only if:

- `running_since` ≥ 7 days continuous paper, and  
- `trade_count` ≥ configured minimum, and  
- `max_drawdown` ≤ configured max

## Tech

Next.js (App Router) + TypeScript + Tailwind + JSON file store under `data/`.
