# Contributing

Thank you for helping improve this **PolyTutor Labs educational paper-trading lab**.

This repository is a learning resource built on an existing open-source project. See [README.md](README.md) Attribution and [DISCLAIMER.md](DISCLAIMER.md). Contributions should make the lab easier to study, safer to run as paper software, or clearer to operate — not turn it into a “profit bot.”

## Accept

We welcome:

- **Documentation** — accuracy, architecture notes, learning guides, risk wording
- **Tests** — Vitest coverage for broker, store, catalog, paths, and API/UI contracts
- **Educational improvements** — comments, examples, and explanations that do not claim guaranteed returns
- **Research improvements** — clearer experiment logs, isolated `LAB_DATA_DIR` workflows, reproducible paper runs
- **Bug fixes** — including documented API/UI mismatches, persistence, and security issues

## Require

Every contribution must:

- **Include no secrets** — no API tokens, Blob credentials, `.env.local` values, or webhook secrets
- **Include no private keys** — no seed phrases, mnemonics, PEM/key material, or trading credentials
- **Include no guaranteed profit claims** — no “always profitable,” “risk-free,” or “will make money” language in code, docs, or UI copy
- **Explain behavior changes** — PR description should say what the learner will observe differently (ticks, fills, rules, APIs, UI)

Do not add live order routing, wallet signing, or custody unless a future project explicitly redesigns that surface and updates the disclaimer. This lab’s v1 scope is paper simulation on public data.

## How to work

1. Read [docs/getting-started.md](docs/getting-started.md) and [docs/architecture.md](docs/architecture.md).
2. Keep paths repo-relative; do not hardcode a personal machine home directory.
3. Put runtime state under `data/` or `LAB_*` overrides (gitignored).
4. Match existing TypeScript style; keep imports at the top of the file.
5. For switches on unions/enums, handle every variant (exhaustive `never` default).

## Checks to run

```bash
npm test
npm run typecheck
npm run lint
python scripts/security/check_secrets.py
```

Use `python3` if `python` is not available.

## Pull requests

- Describe the problem and the verified behavior after the change.
- Link any docs you updated (`README.md`, `docs/*`, `SECURITY.md`, `CHANGELOG.md`).
- If you change strategy or broker behavior, say so explicitly — those are not “docs-only.”
- Do not claim official Polymarket affiliation or investment advice.

## Security reports

Do not open a public issue that includes credential values or exploit details. Use GitHub Security Advisories as described in [SECURITY.md](SECURITY.md).
