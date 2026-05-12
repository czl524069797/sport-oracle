# Project Overview

## Tech Stack
Frontend: Next.js 14 (App Router), TypeScript (strict), Tailwind + shadcn/ui, Zustand + TanStack React Query, RainbowKit + wagmi + viem.
AI & Markets: OpenAI-compatible API (GPT‑4), Polymarket Gamma/CLOB APIs.
Data/DB: Prisma + PostgreSQL/SQLite.
Services: Python FastAPI nba-service (uvicorn), optional VPS deployment; cron jobs.
i18n: Chinese/English UI and AI output; team name translations.

## Architecture & Conventions
- Default to non-custodial flows: no server-held private keys; client-signed orders only; offer “Go to Polymarket” fallback.
- Proposals must state target sport/market scope, data freshness, and compliance/risk notes.
- Specs must cover wallet states (locked, no balance, no allowance), error mapping, and i18n.
- Design must separate frontend vs nba-service responsibilities, rate limits/backoff, caching TTLs, and EIP‑4361/712 details.
- Include DB migration steps and feature flags; document env vars.

## Reference Docs
- README.md (full features, env, deployment)
- docs/TODO.md (non-custodial plan)
- docs/PREDICTION_ALGORITHM*.md
- docs/DATA_SOURCE_STRATEGY.md
- docs/MICRO_BET_FEASIBILITY.md
- docs/PLAYWRIGHT_PRACTICE.md
