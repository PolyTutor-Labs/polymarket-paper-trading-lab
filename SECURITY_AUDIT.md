# Security audit — PolyTutor Labs (polymarket-paper-lab)

**Date:** 2026-09-08  
**Scope:** Current `HEAD` tree (application source, configs, lockfile, docs, public assets) plus git history for deleted staging artifacts.  
**Goal:** Detect malicious, wallet-drain, credential-stealing, obfuscated RCE, shady `postinstall`, or data-exfiltration code.  
**Trading / strategy logic:** Not modified.

## Verdict

**CLEAN**

No planted malware, wallet drainers, credential stealers, obfuscated remote-code-execution payloads, shady install hooks, or covert exfil channels were found in the current repository tree. Wallet-related code is paper-trading copy of public Polymarket leaderboard addresses, not custody or signing of user keys.

## What was checked

| Area | Method | Result |
| --- | --- | --- |
| `package.json` scripts | `dev` / `build` / `start` / `lint` only; no `preinstall`, `install`, `postinstall`, `prepare`, `preuninstall` | Clean |
| Direct dependencies | `@vercel/blob`, `date-fns`, `next`, `react`, `react-dom`, `zod` — known first-party / mainstream packages | Clean |
| `package-lock.json` | All `resolved` URLs are `https://registry.npmjs.org/...`; no alternate registries, git URLs, or file: malware packages; no package-level install scripts on app deps | Clean (see hardening note on Next pin) |
| Source (`src/**`) | `eval` / `new Function` / `atob` / `Buffer.from(..., "base64")` / `child_process` / `WebAssembly` / `vm` / dynamic `Function` | None |
| Network I/O | Server `fetch` only to `https://data-api.polymarket.com/...`; browser `fetch` only to same-origin `/api/*` | Clean |
| Wallet / chain libs | No `ethers`, `viem`, `wagmi`, `web3`, Solana, Phantom, MetaMask, or signing SDKs | Clean |
| Secrets | No committed `.env*`, `.pem`, private keys, mnemonics, or API token values. Env *names* only: `BLOB_READ_WRITE_TOKEN`, `BLOB_STORE_ID`, `VERCEL` | Clean (values not present; none printed here) |
| Persistence | Local `data/lab-state.json` + `data/trade-journal.jsonl` (gitignored) and optional private Vercel Blob `lab-state.json` | Expected for the lab; not exfil |
| Obfuscation / steganography | Zero-width / bidi Unicode scan; long base64-like lines; NUL/binary files; SVG script tags | None in current tree |
| Config / CI | `next.config.ts` empty; `vercel.json` cron to `/api/tick`; no `.github` workflows; git hooks are samples only | No hidden automation |
| Public assets | Default Next/Vercel SVGs; no `javascript:` / event-handler payloads | Clean |
| Git history | Large `.tmp-lock/**` hex/base64 fragments (since deleted) used to assemble `package-lock.json`; one commit briefly replaced `package.json` with the literal text `PLACEHOLDER` then restored it | Historical transfer workaround, not live malware |

## Findings

### Malicious code

**None.**

“Wallet” in this repo means **public Polymarket proxy addresses** on leaderboards (`proxyWallet`). The paper broker updates simulated cash/positions only. There is no live order routing, no `approve` / `transferFrom` / `sendTransaction`, and no handling of user private keys.

Historical `.tmp-lock/*.b64` and hex shards were already removed from `HEAD` (`refactor: organize repository structure for PolyTutor`). Spot-checks of those commits match a split `package-lock.json` transfer, not an encoded dropper.

### Hardening notes (not malware)

These are ordinary application-security gaps. They do **not** change the CLEAN verdict.

1. **Unauthenticated mutating APIs.** `POST /api/bots` (start/stop bots), `POST /api/rules` (overwrite risk rules), and `GET`/`POST /api/tick` (run the paper engine) have no auth, CSRF token, or `CRON_SECRET` check. Anyone who can reach a deployed instance can start bots or change rules. Paper-only, but still abuse-prone on a public URL.

2. **Broad read APIs.** `GET /api/lab` returns the full lab state. `GET /api/trades` exposes the paper journal. Fine for a private lab; not for an unauthenticated public deploy.

3. **Lockfile / Next.js pin drift.** `package.json` requests `next@^15.5.25` (CVE gate) but the lockfile still resolves `next@15.5.2`, which npm marks deprecated for [CVE-2025-66478](https://nextjs.org/blog/CVE-2025-66478). That is a **vulnerable legitimate package**, not a trojan. Regenerating the lockfile was out of scope for this audit (no strategy-logic changes).

4. **Vercel Blob token.** Persistence uses `BLOB_READ_WRITE_TOKEN` when set. The token is not committed. Treat it as a secret; a leak would allow read/write of `lab-state.json` only, not chain funds.

5. **Git history retains deleted lock shards.** Low risk (lockfile fragments). A history rewrite is optional hygiene, not required for CLEAN.

## Remediations

No malicious files to delete.

Recommended follow-ups (separate from this audit commit):

1. Run `npm install next@15.5.25` (or current patched 15.x) and commit the updated lockfile so installs cannot resolve 15.5.2.
2. Gate `POST /api/bots`, `POST /api/rules`, and `/api/tick` (at least the cron GET) with a shared secret header; reject unauthenticated writes on production.
3. Keep `.env*` and Blob tokens out of git (already gitignored).
4. If this dashboard is public, stop returning full `LabState` from `/api/lab` and add auth before considering any live-trading path.
5. Do not reintroduce `.tmp-lock` staging blobs; use a normal lockfile commit.

## Residual risk

This audit is static review of this repository. It does not execute `npm install` against the lockfile, does not inspect `node_modules` (not present), and does not certify upstream npm package contents beyond lockfile URLs and names. Supply-chain risk on future `npm install` remains a general npm risk, not a finding of planted repo malware.
