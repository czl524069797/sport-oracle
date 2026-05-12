# Design

## Architecture

Add a data quality layer between raw source adapters and AI analysis:

```text
Source adapters
  -> identity normalization
  -> market scope classification
  -> freshness and completeness scoring
  -> AI analysis input
  -> edge calculation
  -> UI warnings and recommendation gating
```

## Data Model

Recommended additions:

```ts
type MarketScope =
  | "single_game_moneyline"
  | "single_game_spread"
  | "single_game_total"
  | "season_champion"
  | "conference_champion"
  | "world_cup_winner"
  | "group_stage";

interface DataQualityMeta {
  source: string;
  sourceUpdatedAt: string;
  fetchedAt: string;
  freshnessSeconds: number;
  completenessScore: number;
  consistencyScore: number;
  qualityScore: number;
  warnings: string[];
}
```

## Matching Rules

- Schedule identity should prefer source game IDs and canonical team IDs.
- Polymarket matching may use title and alias only after canonical IDs are unavailable.
- Team aliases should live in one shared module.
- A market without recognized scope must be displayed as informational only.

## Recommendation Gating

| Condition | Behavior |
|:--|:--|
| qualityScore >= 85 | normal recommendation |
| 70 <= qualityScore < 85 | show caution label |
| qualityScore < 70 | disable strong recommendation |
| only futures available | show overview; edge = 0 for single-game analysis |
| stale market price | require refresh before analysis |

## Playwright Strategy

Use mocked API responses for deterministic UI checks first:

- dashboard render
- `/markets` success state
- `/markets` empty state
- `/markets` API error state
- mobile viewport smoke check

Then add live checks after API contracts stabilize:

- `/api/markets` returns source freshness fields.
- `/api/overview?sport=nba` remains accessible.
- stale data warning appears when mocked freshness is old.

## Risks

- Sports data vendors may have license limits; keep vendor abstraction independent.
- Market title parsing is fragile; keep it as fallback, not primary identity.
- LLM explanations can overstate confidence; quality score must gate the final UI language.
