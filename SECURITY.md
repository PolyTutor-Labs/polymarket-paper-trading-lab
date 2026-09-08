# Security Policy

This repository is a **PolyTutor Labs educational paper-trading lab**.

A public clone is not a trusted environment. Treat every checkout, fork, and
deployed preview as a place where secrets can leak if they are committed or
baked into the client bundle.

## Security principles

- Paper simulation only. This lab does not custody wallets, sign transactions,
  or place live Polymarket orders.
- Never assume `public repository` equals a safe place for credentials.
- Keep secrets out of git, docs, screenshots, and `NEXT_PUBLIC_*` variables.
- Local paper trading works with no secrets. Optional hosted persistence tokens
  stay on the server.

## Protected information

Do not commit:

- API keys, bearer tokens, JWTs, or webhook secrets
- Wallet private keys, seed phrases, or mnemonics
- Polymarket / exchange trading credentials
- Database passwords or cloud credentials
- Telegram, Discord, GitHub, or other bot tokens
- Vercel Blob tokens (`BLOB_READ_WRITE_TOKEN`, `BLOB_STORE_ID`)
- Production `.env`, `.env.local`, `.pem`, `.key`, `credentials.json`, or
  `secrets.json`

Use `.env.local` (gitignored) for machine-local overrides. Commit only
`.env.example` with empty or placeholder values.

A secret that was committed even briefly is compromised. Remove it from the
tree, rotate the credential, and treat history as still containing it until
rewritten.

## Environment variables

See `.env.example`. The app reads optional path overrides (`LAB_DATA_DIR`,
`LAB_STATE_FILE`, `LAB_JOURNAL_FILE`) and optional Vercel Blob settings.
None of these are required for local paper trading.

There are no `NEXT_PUBLIC_*` secrets. Browser code talks only to same-origin
`/api/*` routes.

## Secret discovery

Scan this repository (paths and pattern names only; values are never printed):

```bash
python scripts/security/check_secrets.py
```

This is a basic safeguard. It does not replace GitHub secret scanning,
gitleaks, or trufflehog before a public release.

## Reporting a vulnerability

Report security issues privately through
[GitHub Security Advisories](https://github.com/PolyTutor-Labs/polymarket-paper-trading-lab/security/advisories/new)
for this repository. Do not open a public issue that includes credential
values, wallet material, or exploit details.

## Related

`SECURITY_AUDIT.md` records a CLEAN malicious-code / supply-chain review of
this packaging pass. It does not change the paper-trading educational scope
of this lab.
