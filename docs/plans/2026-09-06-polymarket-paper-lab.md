# Polymarket Paper Lab Implementation Plan

> **For agentic workers:** Implement task-by-task. Checkboxes track progress.

**Goal:** Build a phone-friendly dashboard that runs 100 paper strategies ($1000 each) on global Polymarket data and ranks them after ≥7 days.

**Architecture:** Next.js app with JSON persistence, Polymarket public API client, strategy registry, paper broker, bot tick API, and Lab UI.

**Tech Stack:** Next.js 15, TypeScript, Tailwind, Node fetch, local JSON store.

## Global Constraints

- Bankroll: $1000 isolated per bot  
- Paper only in v1  
- 50 wallet-discovery + 50 proprietary strategies registered and runnable  

## Tasks

- [x] Scaffold Next.js app  
- [ ] Core store + paper broker + Polymarket client  
- [ ] Strategy catalog (100)  
- [ ] Bot runner + promotion gate APIs  
- [ ] Dashboard UI  
- [ ] Smoke test locally  
