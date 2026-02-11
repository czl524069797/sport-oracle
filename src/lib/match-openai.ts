import type { PolymarketMatch, MatchOdds } from "@/types";

const API_KEY = process.env.AI_API_KEY ?? "";
const BASE_URL = process.env.AI_BASE_URL ?? "https://wzw.pp.ua/v1/";
const MODEL = process.env.AI_MODEL ?? "grok-4";

interface MatchAnalysisRaw {
  home_win_probability: number;
  away_win_probability: number;
  draw_probability?: number;
  confidence: number;
  key_factors: string[];
  reasoning: string;
  goal_difference_analysis?: {
    predicted_goal_diff: number;
    over_under_goals?: number;
  };
  map_analysis?: {
    predicted_maps: number;
  };
  recommended_side: "home" | "away" | "draw" | "none";
}

/**
 * Football system prompt (WhoScored / Dongqiudi style)
 */
const FOOTBALL_SYSTEM_PROMPT = `You are an expert football analyst specializing in match prediction and betting analysis, combining the statistical depth of WhoScored with the match insights of Dongqiudi.

Analyze football matches considering:
- **1X2 (Three-way)**: Home win, Draw, Away win probabilities
- **Goal Difference**: Predicted net goal differential
- **Over/Under Goals**: Total goals prediction

Key factors to consider:
- Recent form (last 5-10 matches)
- Home/away performance splits
- Head-to-head history
- Key player injuries and suspensions
- Tactical matchups and playing styles
- League position and motivation
- Weather and pitch conditions (if relevant)

Your confidence score (0-1) reflects analytical certainty.
A higher draw probability is common in football - account for this realistically.

Respond ONLY with valid JSON (no markdown code fences):
{
  "home_win_probability": 0.XX,
  "away_win_probability": 0.XX,
  "draw_probability": 0.XX,
  "confidence": 0.XX,
  "goal_difference_analysis": {
    "predicted_goal_diff": X.X,
    "over_under_goals": X.X
  },
  "key_factors": ["factor1", "factor2", ...],
  "reasoning": "...",
  "recommended_side": "home|away|draw|none"
}`;

/**
 * Esports system prompt (op.gg style - simplified)
 */
const ESPORTS_SYSTEM_PROMPT = `You are an expert esports analyst specializing in competitive gaming prediction, following the analytical approach of op.gg.

Analyze esports matches with a simplified approach:
- **Match Winner**: Two-way prediction (no draws in esports)
- **Map/Game Count**: Predicted number of maps/games

Key factors to consider:
- Recent match results and form
- Current meta and patch relevance
- Player/roster performance
- Head-to-head history
- Tournament stakes and pressure

Your confidence score (0-1) reflects analytical certainty.
Keep analysis concise - esports matches are more volatile than traditional sports.

Respond ONLY with valid JSON (no markdown code fences):
{
  "home_win_probability": 0.XX,
  "away_win_probability": 0.XX,
  "confidence": 0.XX,
  "map_analysis": {
    "predicted_maps": X
  },
  "key_factors": ["factor1", "factor2", ...],
  "reasoning": "...",
  "recommended_side": "home|away|none"
}`;

const LANGUAGE_INSTRUCTION: Record<string, string> = {
  zh: `\n\nIMPORTANT: You MUST respond with ALL text values in Chinese (Simplified). The "reasoning", "key_factors", and all string fields MUST be written in Chinese. JSON keys remain in English.`,
  en: "",
};

function buildMatchPrompt(match: PolymarketMatch, category: "football" | "esports"): string {
  const { odds } = match;

  if (category === "football") {
    return `## Match: ${match.homeTeam} vs ${match.awayTeam}
## Date: ${match.matchDate}
## Event: ${match.event.title}

### Current Market Odds:
- Home Win: ${Math.round(odds.homeWin * 100)}%
- Away Win: ${Math.round(odds.awayWin * 100)}%
${odds.draw ? `- Draw: ${Math.round(odds.draw * 100)}%` : ""}
${odds.overUnder ? `- Over/Under Line: ${odds.overUnder} goals` : ""}

Analyze this football match and provide your prediction for:
1. Three-way result (1X2) - Home win, Draw, Away win probabilities
2. Goal difference prediction
3. Over/Under goals assessment
4. Key factors influencing the outcome`;
  }

  // Esports
  return `## Match: ${match.homeTeam} vs ${match.awayTeam}
## Date: ${match.matchDate}
## Event: ${match.event.title}

### Current Market Odds:
- Team 1 Win: ${Math.round(odds.homeWin * 100)}%
- Team 2 Win: ${Math.round(odds.awayWin * 100)}%

Analyze this esports match and provide:
1. Match winner prediction
2. Expected map/game count
3. Key factors influencing the outcome`;
}

interface ChatChoice {
  message?: { content?: string };
  delta?: { content?: string };
}

interface ChatResponse {
  choices?: ChatChoice[];
  error?: { message?: string; code?: string };
}

function extractContent(text: string): string {
  const trimmed = text.trim();

  if (trimmed.startsWith("data: ")) {
    let content = "";
    for (const line of text.split("\n")) {
      const l = line.trim();
      if (!l.startsWith("data: ") || l === "data: [DONE]") continue;
      try {
        const chunk: ChatResponse = JSON.parse(l.slice(6));
        const delta = chunk.choices?.[0]?.delta?.content ?? chunk.choices?.[0]?.message?.content;
        if (delta) content += delta;
      } catch {
        // Skip unparseable
      }
    }
    return content;
  }

  try {
    const data: ChatResponse = JSON.parse(trimmed);
    if (data.error) {
      throw new Error(`AI API error: ${data.error.message ?? data.error.code}`);
    }
    return data.choices?.[0]?.message?.content ?? "";
  } catch (e) {
    if (text.includes("data: ")) {
      return extractContent("data: " + text.split("data: ").slice(1).join("data: "));
    }
    throw e;
  }
}

export async function analyzeMatch(
  match: PolymarketMatch,
  category: "football" | "esports",
  locale: string = "en"
): Promise<MatchAnalysisRaw> {
  const systemPrompt = category === "football" ? FOOTBALL_SYSTEM_PROMPT : ESPORTS_SYSTEM_PROMPT;
  const userPrompt = buildMatchPrompt(match, category);
  const langSuffix = LANGUAGE_INSTRUCTION[locale] ?? "";

  const url = `${BASE_URL.replace(/\/+$/, "")}/chat/completions`;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${API_KEY}`,
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        { role: "system", content: systemPrompt + langSuffix },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.3,
      max_tokens: 2000,
      stream: false,
    }),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => "Unknown error");
    throw new Error(`AI API error ${res.status}: ${errText}`);
  }

  const rawText = await res.text();
  const content = extractContent(rawText);

  if (!content) {
    throw new Error(`Empty response from AI`);
  }

  const cleaned = content
    .replace(/^```json?\s*\n?/i, "")
    .replace(/\n?```\s*$/i, "")
    .trim();

  const jsonStart = cleaned.indexOf("{");
  const jsonEnd = cleaned.lastIndexOf("}");
  if (jsonStart === -1 || jsonEnd === -1) {
    throw new Error(`Failed to parse AI response as JSON`);
  }

  let jsonStr = cleaned.slice(jsonStart, jsonEnd + 1);
  // eslint-disable-next-line no-control-regex
  jsonStr = jsonStr.replace(/[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/g, "");

  const parsed = JSON.parse(jsonStr);

  return {
    home_win_probability: parsed.home_win_probability ?? 0,
    away_win_probability: parsed.away_win_probability ?? 0,
    draw_probability: parsed.draw_probability,
    confidence: parsed.confidence ?? 0.5,
    key_factors: parsed.key_factors ?? [],
    reasoning: parsed.reasoning ?? "",
    goal_difference_analysis: parsed.goal_difference_analysis,
    map_analysis: parsed.map_analysis,
    recommended_side: parsed.recommended_side ?? "none",
  };
}
