# Playwright Practice Plan

## Goal

Use Playwright to prove SportOracle's core user-visible flows are stable:

- app shell renders
- NBA markets page loads
- no-data/error states are understandable
- data quality warnings do not break layout
- mobile view remains usable

The repository now includes `@playwright/test`, `playwright.config.ts`, and a spec draft under `tests/e2e/`. Browser verification is still gated and was not run automatically.

## Proposed Setup

Install browser binaries only when ready:

```bash
pnpm exec playwright install chromium
```

Available scripts:

```json
{
  "test:e2e": "playwright test",
  "test:e2e:report": "playwright show-report"
}
```

## Browser Matrix

| Project | Viewport | Purpose |
|:--|:--|:--|
| chromium-desktop | 1440x900 | primary app flow |
| mobile-ios | 390x844 | iPhone-sized layout |
| mobile-android | 412x915 | Android-sized layout |

## Critical Journeys

1. Dashboard renders `SportOracle`, navigation and primary CTAs.
2. NBA markets page renders the title and handles `/api/markets` success.
3. NBA markets page handles empty games without crashing.
4. API failure shows retry/error state.
5. Mobile viewport keeps header, market list and analysis panel readable.

## Data Quality Assertions

When data quality fields are implemented, Playwright should verify:

- stale source warning appears when `sourceUpdatedAt` is older than target freshness.
- single-game edge is hidden when only season futures exist.
- Polymarket event link is visible only when event slug/token ID exists.
- low data quality score disables strong bet recommendation copy.

## Current Draft

See `tests/e2e/sports-data-quality.spec.ts`.

## Verification Gate

Per project rule, run Playwright only after explicit confirmation. Expected command:

```bash
pnpm exec playwright test
```

Expected report:

```text
playwright-report/index.html
```
