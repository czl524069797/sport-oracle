# Harden Sports Data Quality

## Summary

SportOracle should stop treating sports data, prediction market prices and LLM output as equally trustworthy. This change introduces a data quality layer for NBA/football/esports markets, with explicit source freshness, market scope, identity matching and UI warnings.

## Motivation

Current issues:

- NBA schedule and markets may be matched by title/alias instead of canonical identity.
- UTC date handling can drift from NBA game-day expectations.
- Season futures can appear beside single-game analysis, creating risk of invalid edge comparison.
- Football/World Cup and esports rely heavily on market text and model knowledge.
- The UI does not yet expose whether data is fresh, incomplete or degraded.

## Scope

In scope:

- Data source strategy and source freshness model.
- Canonical team/event identity rules.
- Market scope classification.
- Data quality score and user-visible warnings.
- Playwright acceptance coverage for dashboard, NBA markets, empty/error states and mobile layout.

Out of scope:

- Automatic betting by server-held private key.
- Paid vendor integration secrets.
- Guaranteed prediction accuracy.

## Success Criteria

- Each analysis can state which source was used and when it was refreshed.
- Single-game recommendations only use comparable single-game markets.
- Low-quality or stale data visibly downgrades recommendation strength.
- Playwright acceptance checks can verify the main UI paths once dependencies are installed and the user confirms execution.
