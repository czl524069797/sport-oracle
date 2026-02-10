import type { AIAnalysisInput, AIAnalysisResult } from "@/types";

const API_KEY = process.env.AI_API_KEY ?? "";
const BASE_URL = process.env.AI_BASE_URL ?? "https://wzw.pp.ua/v1/";
const MODEL = process.env.AI_MODEL ?? "grok-4";

function buildPrompt(input: AIAnalysisInput): string {
  const { game, homeStats, awayStats, homePlayers, awayPlayers, headToHead, marketPrice } = input;

  const formatPlayers = (players: typeof homePlayers) =>
    players
      .slice(0, 5)
      .map(
        (p) =>
          `  ${p.playerName} (${p.position}): ${p.pointsPerGame}ppg / ${p.assistsPerGame}apg / ${p.reboundsPerGame}rpg${p.isInjured ? ` [INJURED: ${p.injuryStatus}]` : ""}`
      )
      .join("\n");

  return `## Game: ${game.awayTeam.teamName} @ ${game.homeTeam.teamName}
## Date: ${game.gameDate}

### Home Team (${game.homeTeam.teamName}) Recent Stats:
- Last 10 games: ${homeStats.last10Record}
- Home record: ${homeStats.homeRecord}
- Offensive rating: ${homeStats.offensiveRating} | Defensive rating: ${homeStats.defensiveRating}
- Net rating: ${homeStats.netRating}
- Pace: ${homeStats.pace}
- Points per game: ${homeStats.pointsPerGame} | Opp PPG: ${homeStats.opponentPointsPerGame}
- Key players:
${formatPlayers(homePlayers)}

### Away Team (${game.awayTeam.teamName}) Recent Stats:
- Last 10 games: ${awayStats.last10Record}
- Away record: ${awayStats.awayRecord}
- Offensive rating: ${awayStats.offensiveRating} | Defensive rating: ${awayStats.defensiveRating}
- Net rating: ${awayStats.netRating}
- Pace: ${awayStats.pace}
- Points per game: ${awayStats.pointsPerGame} | Opp PPG: ${awayStats.opponentPointsPerGame}
- Key players:
${formatPlayers(awayPlayers)}

### Head-to-Head (this season): Home ${headToHead.homeWins} - Away ${headToHead.awayWins}
${headToHead.games.map((g) => `  ${g.date}: ${g.homeScore}-${g.awayScore} (${g.winner})`).join("\n")}

### Current Market Prices:
- Moneyline: Home ${marketPrice.home}, Away ${marketPrice.away}

Based on the above stats, analyze:
1. **Moneyline (胜负)**: Which team will win?
2. **Point Spread (让分)**: Estimate the point spread and which team covers.
3. **Over/Under (大小分)**: Estimate the total points and whether the game goes over or under.
4. **News Impact**: Based on your knowledge, note any recent relevant news (injuries, trades, rest days).

Respond ONLY with valid JSON (no markdown code fences, no extra text):
{
  "home_win_probability": 0.XX,
  "away_win_probability": 0.XX,
  "confidence": 0.XX,
  "confidence_explanation": "Explain why the confidence is at this level - what factors increase or decrease certainty",
  "predicted_spread": -X.X,
  "spread_analysis": {
    "favored_team": "home|away",
    "spread_value": X.X,
    "spread_confidence": 0.XX,
    "cover_recommendation": "home|away"
  },
  "total_points_analysis": {
    "predicted_total": XXX.X,
    "over_under_line": XXX.X,
    "over_probability": 0.XX,
    "under_probability": 0.XX,
    "ou_confidence": 0.XX,
    "recommendation": "over|under"
  },
  "key_factors": ["factor1", "factor2", ...],
  "news_highlights": ["headline1", "headline2", ...],
  "reasoning": "..."
}`;
}

const SYSTEM_PROMPT = `You are an expert NBA analyst and sports betting strategist with deep knowledge of the current 2025-26 NBA season. You analyze NBA games and provide probability estimates for three bet types:

1. **Moneyline (胜负)**: Win probability for each team
2. **Point Spread (让分)**: Expected point differential and spread coverage
3. **Over/Under (大小分)**: Total game points prediction

You MUST base your analysis on:
- **Recent form and trends** (last 10 games record is critical — a hot team vs a cold team matters enormously)
- **Home/away splits** (some teams are dominant at home but struggle on the road)
- Offensive and defensive ratings, net rating
- Key player stats and injury status
- Head-to-head matchups this season
- Pace and tempo matchups (two fast-paced teams = higher total)
- Your knowledge of recent NBA news (injuries, trades, lineup changes, rest days, back-to-backs)

Your confidence score (0-1) reflects how certain you are in your analysis.
A negative spread means the home team is favored (e.g., -5.5 means home favored by 5.5).
Always provide honest, data-driven estimates. Pay special attention to recent form — a team on a winning streak or losing streak is a strong signal.
Include a "news_highlights" array with 2-5 key factors/news items affecting the game.
Include a "confidence_explanation" string explaining why your confidence level is what it is — what factors increase certainty and what factors create uncertainty.
Respond ONLY with valid JSON, no markdown formatting or code fences.`;

const LANGUAGE_INSTRUCTION: Record<string, string> = {
  zh: `\n\nIMPORTANT: You MUST respond with ALL text values in Chinese (Simplified). The "reasoning", "key_factors", "news_highlights", "confidence_explanation", and all string fields MUST be written in Chinese. The JSON keys should remain in English, but ALL values should be in Chinese.`,
  en: "",
};

interface ChatChoice {
  message?: {
    content?: string;
  };
  delta?: {
    content?: string;
  };
}

interface ChatResponse {
  choices?: ChatChoice[];
  error?: {
    message?: string;
    code?: string;
    type?: string;
  };
}

/**
 * Read an SSE stream text and concatenate all delta.content chunks.
 */
function extractSSEContent(text: string): string {
  let content = "";
  for (const line of text.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed.startsWith("data: ") || trimmed === "data: [DONE]") continue;
    try {
      const chunk: ChatResponse = JSON.parse(trimmed.slice(6));
      // Support both streaming (delta) and non-streaming (message) formats
      const delta = chunk.choices?.[0]?.delta?.content ?? chunk.choices?.[0]?.message?.content;
      if (delta) content += delta;
    } catch {
      // Skip unparseable lines
    }
  }
  return content;
}

/**
 * Parse raw response text — handles both SSE streams and standard JSON.
 */
function extractContent(text: string): string {
  const trimmed = text.trim();

  // If it starts with "data: " it's an SSE stream
  if (trimmed.startsWith("data: ")) {
    return extractSSEContent(text);
  }

  // Try parsing as standard OpenAI JSON response
  try {
    const data: ChatResponse = JSON.parse(trimmed);
    if (data.error) {
      throw new Error(`AI API error: ${data.error.message ?? data.error.code}`);
    }
    return data.choices?.[0]?.message?.content ?? "";
  } catch (e) {
    // If JSON parse failed, maybe it's SSE without the expected prefix on first line
    // (some proxies add extra headers or blank lines before SSE data)
    if (text.includes("data: ")) {
      return extractSSEContent(text);
    }
    throw e;
  }
}

export async function analyzeGame(
  input: AIAnalysisInput,
  locale: string = "en"
): Promise<AIAnalysisResult> {
  const userPrompt = buildPrompt(input);
  const langSuffix = LANGUAGE_INSTRUCTION[locale] ?? "";

  const url = `${BASE_URL.replace(/\/+$/, "")}/chat/completions`;

  const requestBody = {
    model: MODEL,
    messages: [
      { role: "system", content: SYSTEM_PROMPT + langSuffix },
      { role: "user", content: userPrompt },
    ],
    temperature: 0.3,
    max_tokens: 4000,
    stream: false,
  };

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${API_KEY}`,
    },
    body: JSON.stringify(requestBody),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => "Unknown error");
    throw new Error(`AI API error ${res.status}: ${errText}`);
  }

  // Always read as text first, then intelligently parse
  const rawText = await res.text();
  const content = extractContent(rawText);

  if (!content) {
    throw new Error(`Empty response from AI. Raw (first 300 chars): ${rawText.slice(0, 300)}`);
  }

  // Strip markdown code fences if present
  const cleaned = content
    .replace(/^```json?\s*\n?/i, "")
    .replace(/\n?```\s*$/i, "")
    .trim();

  // Find the JSON object boundaries in case there's extra text
  const jsonStart = cleaned.indexOf("{");
  const jsonEnd = cleaned.lastIndexOf("}");
  if (jsonStart === -1 || jsonEnd === -1) {
    throw new Error(`Failed to parse AI response as JSON: ${cleaned.slice(0, 200)}`);
  }
  let jsonStr = cleaned.slice(jsonStart, jsonEnd + 1);

  // Only strip truly problematic control characters (NUL, etc.).
  // Do NOT replace \n, \r, \t — they are valid JSON whitespace outside strings
  // eslint-disable-next-line no-control-regex
  jsonStr = jsonStr.replace(/[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/g, "");

  try {
    const parsed = JSON.parse(jsonStr);

    return {
      homeWinProbability: parsed.home_win_probability,
      awayWinProbability: parsed.away_win_probability,
      confidence: parsed.confidence,
      confidenceExplanation: parsed.confidence_explanation ?? "",
      keyFactors: parsed.key_factors ?? [],
      reasoning: parsed.reasoning ?? "",
      newsHighlights: parsed.news_highlights ?? [],
      spreadAnalysis: {
        favoredTeam: parsed.spread_analysis?.favored_team ?? "home",
        spreadValue: parsed.spread_analysis?.spread_value ?? 0,
        spreadConfidence: parsed.spread_analysis?.spread_confidence ?? 0,
        coverRecommendation: parsed.spread_analysis?.cover_recommendation ?? "none",
      },
      totalPointsAnalysis: {
        predictedTotal: parsed.total_points_analysis?.predicted_total ?? 0,
        overUnderLine: parsed.total_points_analysis?.over_under_line ?? 0,
        overProbability: parsed.total_points_analysis?.over_probability ?? 0,
        underProbability: parsed.total_points_analysis?.under_probability ?? 0,
        ouConfidence: parsed.total_points_analysis?.ou_confidence ?? 0,
        recommendation: parsed.total_points_analysis?.recommendation ?? "none",
      },
    };
  } catch (parseError) {
    console.error("[openai] JSON parse failed. jsonStr first 1000 chars:", jsonStr.slice(0, 1000));
    console.error("[openai] JSON parse error:", parseError);
    throw new Error(
      `Failed to parse AI JSON response: ${parseError instanceof Error ? parseError.message : "Unknown parse error"}. Content starts with: ${jsonStr.slice(0, 100)}`
    );
  }
}
