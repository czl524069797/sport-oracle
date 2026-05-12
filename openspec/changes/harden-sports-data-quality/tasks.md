# Tasks

- [ ] 1. Identity and source model
  - [ ] 1.1 Move NBA team aliases into a shared identity module.
  - [ ] 1.2 Add canonical event/team identity fields to NBA game enrichment.
  - [ ] 1.3 Store source timestamps for schedule, stats and market data.

- [ ] 2. Market scope and quality score
  - [ ] 2.1 Classify markets into single-game, futures and informational scopes.
  - [ ] 2.2 Add freshness/completeness/consistency scoring.
  - [ ] 2.3 Prevent futures prices from feeding single-game edge.

- [ ] 3. UI and API
  - [ ] 3.1 Add data quality warnings to NBA market cards.
  - [ ] 3.2 Add `/api/data-quality?sport=nba` diagnostics.
  - [ ] 3.3 Show stale source and low-quality warnings in analysis output.

- [ ] 4. Documentation
  - [x] 4.1 Add `docs/DATA_SOURCE_STRATEGY.md`.
  - [x] 4.2 Add `docs/PLAYWRIGHT_PRACTICE.md`.
  - [x] 4.3 Add OpenSpec proposal, design, tasks and requirement spec.

- [ ] 5. Playwright
  - [x] 5.1 Add draft spec under `tests/e2e/`.
  - [x] 5.2 Add Playwright dependency and config.
  - [ ] 5.3 Run `pnpm exec playwright test` after explicit approval.
  - [ ] 5.4 Record `playwright-report/index.html` in the final verification note.
