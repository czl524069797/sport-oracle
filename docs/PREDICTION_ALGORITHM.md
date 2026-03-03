# Sport Oracle - Prediction Algorithm Documentation

## System Overview

Sport Oracle is an AI-powered sports prediction platform that:
1. Aggregates real-time game data (NBA, Football, Esports)
2. Feeds structured data to an LLM for probabilistic analysis
3. Compares AI probabilities against Polymarket odds to detect **market edge**
4. Uses **Kelly Criterion** for optimal bet sizing
5. Optionally auto-executes trades on Polymarket

```
┌──────────────┐    ┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│  Data Layer  │───▶│   AI Layer   │───▶│  Edge Layer  │───▶│  Bet Layer   │
│              │    │              │    │              │    │              │
│ NBA API      │    │ Grok-4 LLM   │    │ Vig removal  │    │ Kelly sizing │
│ Polymarket   │    │ Structured   │    │ Edge calc    │    │ Risk limits  │
│ Team stats   │    │ prompt + JSON│    │ Side select  │    │ Auto-execute │
└──────────────┘    └──────────────┘    └──────────────┘    └──────────────┘
```

---

## 1. Data Pipeline

### NBA Data Sources

| Source | Data | Refresh |
|--------|------|---------|
| NBA API (Python service) | Game schedule, team stats, player stats, H2H | Real-time |
| Polymarket Gamma API | Season championship odds per team | 10 min cache |
| Polymarket Gamma API | Single-game moneyline, spread, O/U | 5 min cache |

### Data Fed to AI (per game)

```typescript
interface AIAnalysisInput {
  game: NBAGame;                    // Teams, date, status
  homeStats: TeamStats;             // Last 10, home record, ORTG/DRTG/NET/PACE/PPG
  awayStats: TeamStats;             // Same for away
  homePlayers: PlayerStats[];       // Top 5 players: PPG/APG/RPG + injury status
  awayPlayers: PlayerStats[];
  headToHead: HeadToHead;           // Season H2H record + game scores
  marketPrice: { home, away };      // Current Polymarket odds (game-level preferred)
}
```

### Football/Esports Data

Football and Esports matches receive minimal structured data (market odds only).
The AI relies more heavily on its training knowledge for these categories.

---

## 2. AI Analysis Engine

### Model Configuration

| Parameter | Value | Rationale |
|-----------|-------|-----------|
| Model | `grok-4` | Via OpenAI-compatible proxy |
| Temperature | `0.3` | Low = more deterministic/consistent predictions |
| Max tokens | `4000` (NBA), `2000` (Football/Esports) | NBA has more complex analysis |
| Tool use | Disabled (`tool_choice: "none"`) | Prevents model from attempting web search |

### Prompt Structure

**System Prompt** defines the AI as an expert analyst and instructs it to:
- Base analysis on recent form (last 10 games), home/away splits, ratings, injuries, H2H
- Output probabilities for moneyline, spread, and over/under
- Provide confidence score (0-1) with explanation
- Return structured JSON only

**User Prompt** injects specific game data (stats, players, H2H, market prices).

**Language Instruction** appended for Chinese locale to ensure all text values are in Simplified Chinese while JSON keys remain English.

### AI Output Schema (NBA)

```json
{
  "home_win_probability": 0.62,
  "away_win_probability": 0.38,
  "confidence": 0.75,
  "confidence_explanation": "...",
  "predicted_spread": -5.5,
  "spread_analysis": {
    "favored_team": "home",
    "spread_value": 5.5,
    "spread_confidence": 0.70,
    "cover_recommendation": "home"
  },
  "total_points_analysis": {
    "predicted_total": 215.5,
    "over_under_line": 213.5,
    "over_probability": 0.55,
    "under_probability": 0.45,
    "ou_confidence": 0.60,
    "recommendation": "over"
  },
  "key_factors": ["..."],
  "news_highlights": ["..."],
  "reasoning": "..."
}
```

### Post-Processing Pipeline

```
AI raw output
  → validateAndClamp()      // Clamp all probabilities to [0, 1]
  → normalizeProbabilities() // Force home + away = 1.0
  → calculateNBAEdge()       // Compare vs market odds
```

---

## 3. Edge Calculation

### Definition

**Edge** = AI estimated probability − Market implied probability (vig-adjusted)

A positive edge means the AI believes the market is underpricing a team.

### Vig Removal

Polymarket odds include ~4% overround (vig). Raw implied probabilities sum to ~1.04:

```
Raw:     Home 0.54 + Away 0.50 = 1.04 (4% vig)
Adjusted: Home 0.54/1.04 = 0.519, Away 0.50/1.04 = 0.481
```

```typescript
function removeVig(homeImplied: number, awayImplied: number) {
  const total = homeImplied + awayImplied;
  return { home: homeImplied / total, away: awayImplied / total };
}
```

### Edge Calculation Flow

```typescript
// 1. Get vig-adjusted market probabilities
const adjusted = removeVig(marketHome, marketAway);

// 2. Calculate edge per side
const homeEdge = aiHomeProb - adjusted.home;   // e.g. 0.62 - 0.519 = +0.101
const awayEdge = aiAwayProb - adjusted.away;   // e.g. 0.38 - 0.481 = -0.101

// 3. Pick best side if edge >= 5%
if (homeEdge >= 0.05) → recommend home
if (awayEdge >= 0.05) → recommend away
otherwise → no recommendation
```

### Odds Source Priority

1. **Single-game moneyline** (from `getNBAGameMarkets()`) — preferred
2. **Season championship odds** (from `getNBASeasonMarkets()`) — fallback, less accurate

When only championship odds are available, edge is set to 0 (no recommendation) because comparing single-game probability against season-long odds is invalid.

### Football/Esports Edge

Simpler: direct subtraction of AI probability minus market odds. No vig adjustment (market odds are already normalized for these).

---

## 4. Kelly Criterion Bet Sizing

### Formula

The Kelly Criterion determines the optimal fraction of bankroll to wager:

```
f* = (bp - q) / b

where:
  b = decimal odds payout ratio = (1/marketPrice) - 1
  p = AI estimated win probability
  q = 1 - p (loss probability)
  f* = fraction of bankroll to bet
```

### Safety Adjustments

| Adjustment | Factor | Rationale |
|------------|--------|-----------|
| Quarter-Kelly | ×0.25 | Industry standard to reduce variance |
| Confidence weighting | ×confidence | Lower confidence → smaller bet |
| Per-bet cap | max 10% of daily budget | Prevents single-bet concentration |
| Max bet limit | per strategy config | User-defined maximum |
| Daily budget | per strategy config | Stop-loss for the day |

### Example Calculation

```
Scenario:
  AI says home team wins with p = 0.65
  Polymarket price = 0.55 (implied 55%)
  Confidence = 0.75
  Daily budget = $50

Step 1: Decimal odds
  decimalOdds = 1 / 0.55 = 1.818
  b = 1.818 - 1 = 0.818

Step 2: True Kelly
  f* = (0.818 × 0.65 - 0.35) / 0.818
     = (0.532 - 0.35) / 0.818
     = 0.222 (22.2% of bankroll)

Step 3: Quarter-Kelly × confidence
  adjusted = 0.222 × 0.25 × 0.75 = 0.042 (4.2%)

Step 4: Bet amount
  amount = $50 × 0.042 = $2.08
```

### Betting Decision Tree

```
shouldBet(analysis, strategy):
  ├─ strategy.isActive?           → No → skip
  ├─ recommendedSide != "none"?   → No → skip
  ├─ confidence >= minConfidence?  → No → skip
  ├─ edgePercent >= 3%?           → No → skip
  └─ YES → calculate Kelly amount
       ├─ Kelly <= 0?              → skip
       ├─ exceeds daily budget?    → skip
       └─ place bet
```

---

## 5. JSON Response Parsing

The AI response parser handles several edge cases:

### Balanced Bracket Parser

Instead of naive first/last brace extraction, we use a state machine:

```
1. Find first '{' in response
2. Track depth (nesting), string context, escape chars
3. When depth returns to 0, extract candidate JSON
4. Validate candidate contains expected fields (home_win_probability)
5. If not our analysis JSON (e.g., a tool-call object), skip and continue
6. Fallback to first-to-last brace if balanced parsing fails
```

This handles cases where the AI model returns:
- Tool call JSON before analysis: `{"query":"..."} {"home_win_probability":...}`
- Markdown fences: ````json { ... } ````
- Extra text after JSON

---

## 6. Architecture Decisions

### Why LLM Instead of Statistical Model?

| Aspect | Statistical Model | LLM-based |
|--------|------------------|-----------|
| Setup cost | High (feature engineering, training data) | Low (prompt engineering) |
| Data requirement | Large historical dataset | Current season stats suffice |
| Injury/news impact | Hard to quantify | Natural language understanding |
| Adaptability | Retrain required | Prompt update only |
| Explainability | Coefficients | Natural language reasoning |
| Accuracy ceiling | Higher with good data | Limited by model knowledge |

**Trade-off**: We sacrifice statistical rigor for development speed and adaptability. The system can be improved by adding a statistical model layer that feeds into the prompt.

### Why Polymarket?

- Only major prediction market with REST API + on-chain settlement
- CLOB (Central Limit Order Book) provides real bid/ask pricing
- NBA game markets provide single-game moneyline odds (not available on most exchanges)
- On-chain settlement = trustless, no counterparty risk

---

## 7. Known Limitations & Future Improvements

### Current Limitations

| Limitation | Impact | Severity |
|------------|--------|----------|
| No outcome tracking | Can't measure prediction accuracy | HIGH |
| No confidence calibration | AI confidence may be systematically biased | HIGH |
| Single model (no ensemble) | Subject to single-model bias | MEDIUM |
| No back-to-back fatigue data | Missing ~2-4 point impact factor | MEDIUM |
| No strength-of-schedule adjustment | Win streaks against weak teams overvalued | MEDIUM |
| Championship odds fallback | Edge invalid when no game-level odds | LOW |

### Planned Improvements

**P1 — Outcome Tracking**
- Store actual final scores alongside predictions
- Calculate Brier score, calibration curves, ROI
- Auto-detect model drift (confidence vs accuracy divergence)

**P2 — Ensemble Predictions**
- Query 2-3 models at different temperatures
- Use inter-model disagreement as confidence signal
- Average probabilities, weight by historical accuracy

**P3 — Enhanced Data**
- Back-to-back game indicator
- Altitude factor (Denver home games +3.5 pts)
- Travel distance/timezone crossing
- True Shooting % and Player Efficiency Rating
- Opponent-adjusted statistics (SOS)

**P4 — Confidence Calibration**
- After 100+ predictions, build calibration map
- If "70% confidence" predictions are actually 60% accurate, correct to 0.60
- Apply calibration correction before edge calculation

---

## 8. File Reference

| File | Purpose |
|------|---------|
| `src/lib/openai.ts` | NBA AI prompt construction + LLM API call + JSON parsing |
| `src/lib/match-openai.ts` | Football/Esports AI prompt + API call |
| `src/lib/ai-analyzer.ts` | NBA orchestrator: data fetch → AI call → edge calc → DB persist |
| `src/lib/match-ai-analyzer.ts` | Football/Esports orchestrator |
| `src/lib/bet-executor.ts` | Kelly Criterion + bet placement + daily budget tracking |
| `src/lib/polymarket.ts` | Polymarket API: season odds, game odds, order book |
| `src/lib/nba-data.ts` | NBA stats API client |
| `src/lib/strategy-engine.ts` | Auto-execute strategy runner |
| `src/app/api/analysis/route.ts` | NBA analysis API endpoint |
| `src/app/api/match-analysis/route.ts` | Football/Esports analysis API endpoint |
| `src/types/index.ts` | TypeScript type definitions |
