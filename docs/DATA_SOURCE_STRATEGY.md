# SportOracle Data Source Strategy

## Purpose

SportOracle 的数据不准，核心原因通常不是模型，而是数据源边界不清：

- 赛程、比分、球队统计、伤病、盘口、预测市场价格来自不同系统，更新时间不同。
- NBA 单场盘口和赛季 futures 不能混用。
- Polymarket 市场标题、球队别名和比赛主客场经常需要归一化匹配。
- LLM 只能分析输入数据，不能补偿过期、缺失或错误的结构化数据。

本文把数据源、校验、回退和验收标准固定下来。

## Current Sources

| Domain | Current source | Code location | Risk |
|:--|:--|:--|:--|
| NBA schedule | NBA static schedule JSON | `nba-service/services/nba_client.py` | 使用 UTC 日期，可能和本地/美东比赛日错位 |
| NBA team/player stats | Python NBA service | `src/lib/nba-data.ts` | 当前 stats 维度仍需要补充真实近期状态、伤病和 player availability |
| NBA markets | Polymarket Gamma events, `tag_id=100639` | `src/lib/polymarket.ts` | 标题解析和球队别名匹配会漏市场 |
| Season futures | Polymarket Gamma event slugs | `src/lib/polymarket.ts` | 只能用于赛季趋势，不能用于单场 edge |
| AI analysis | OpenAI-compatible API | `src/lib/openai.ts`, `src/lib/ai-analyzer.ts` | 输入不可信会导致输出不可信 |

## Target Source Matrix

| Data type | Primary source | Secondary source | Freshness target | Validation |
|:--|:--|:--|:--|:--|
| NBA schedule | NBA official CDN/static data | `nba_api` scoreboard endpoints | 5-15 min on game day | gameId, date, home/away, status cross-check |
| NBA team stats | `nba_api` stats endpoints | cached historical snapshots | 1-6 h | teamId, season, last10, pace, ORTG/DRTG not zero |
| Player availability | Official injury report or paid sports feed | team/news feed summary | 15-60 min before tipoff | player name/team matching, status enum |
| Polymarket markets | Gamma API event/market data | CLOB order book/price endpoints | 1-5 min | active/closed, outcome prices, token IDs |
| World Cup schedule | FIFA/official competition data or vetted sports API | API-SPORTS football | 1-24 h | match date, group/round, teams, venue |
| Odds/reference lines | Sports data vendor | Polymarket only when vendor unavailable | 1-15 min | line type, timestamp, market scope |

## Data Source Selection

Pragmatic rule:

1. Use official or near-official sources for schedule and identity.
2. Use specialized sports APIs for injuries, lineups and advanced stats when free sources are incomplete.
3. Use Polymarket for prediction market prices, not as the only sports truth source.
4. Let LLM explain, rank and summarize; do not let it invent structured facts.

Candidate references:

- Polymarket Docs: `https://docs.polymarket.com/`
- Polymarket Gamma API base currently used by the app: `https://gamma-api.polymarket.com`
- Polymarket CLOB API base currently used by the app: `https://clob.polymarket.com`
- `nba_api` project documentation: `https://nba-api-sbang.readthedocs.io/`
- API-SPORTS NBA/Football docs: `https://www.api-football.com/documentation-v3` and `https://api-sports.io/documentation/nba/v2`
- Sportradar developer docs: `https://developer.sportradar.com/`

## Accuracy Guardrails

### 1. Date and timezone

All game-day matching must store:

- `gameDateUtc`
- `gameDateEt`
- `sourceUpdatedAt`
- `marketEndDate`

NBA display may use local language, but matching must use canonical IDs and timestamps.

### 2. Team identity

Create one canonical map:

- team id
- full English name
- abbreviation
- Chinese name
- common aliases
- Polymarket aliases

Do not scatter team aliases across multiple files.

### 3. Market scope

Each market must be tagged:

- `single_game_moneyline`
- `single_game_spread`
- `single_game_total`
- `season_champion`
- `conference_champion`
- `world_cup_winner`
- `group_stage`

Only `single_game_*` can feed single-game edge. Futures may appear in overview, but edge must be zero or clearly labeled as not comparable.

### 4. Freshness scoring

Every analysis should carry a data quality score:

| Signal | Weight |
|:--|--:|
| schedule freshness | 20 |
| market freshness | 25 |
| team stats completeness | 20 |
| injury/player availability | 15 |
| cross-source consistency | 20 |

If score < 70, UI should show “data quality low” and disable strong recommendations.

## Implementation Plan

1. Add a normalized `sports-data-source` layer.
2. Move team aliases from `polymarket.ts` into a shared identity module.
3. Store source timestamps and freshness score in `GameWithOdds`.
4. Add diagnostics endpoint: `/api/data-quality?sport=nba`.
5. Add Playwright checks for markets page, stale data warning and mobile layout.
6. Add daily review task to compare 5 random games against official source and Polymarket page.

## Acceptance Criteria

- NBA single-game analysis never uses season futures for edge.
- Every game shown in UI has source timestamp and market scope.
- Missing or stale data is visible to the user.
- Polymarket URL opens the exact event when available.
- Playwright verifies dashboard, NBA market page, empty/error states and one mobile viewport after the user confirms running browser checks.
