import type { MatchAnalysisWithEdge, PolymarketMatch, MatchOdds } from "@/types";
import { analyzeMatch } from "./match-openai";

function calculateEdge(
  aiProbability: number,
  marketOdds: number,
  category: "football" | "esports"
): number {
  // Edge = AI probability - market implied probability
  const edge = aiProbability - marketOdds;
  return Math.round(edge * 100) / 100; // Round to 2 decimal places
}

function determineRecommendedSide(
  homeProb: number,
  awayProb: number,
  drawProb: number | undefined,
  marketOdds: MatchOdds,
  confidence: number
): "home" | "away" | "draw" | "none" {
  const MIN_CONFIDENCE = 0.6;
  const MIN_EDGE = 0.05; // 5% edge threshold

  if (confidence < MIN_CONFIDENCE) return "none";

  const homeEdge = homeProb - marketOdds.homeWin;
  const awayEdge = awayProb - marketOdds.awayWin;
  const drawEdge = drawProb && marketOdds.draw ? drawProb - marketOdds.draw : -1;

  const edges = [
    { side: "home" as const, edge: homeEdge },
    { side: "away" as const, edge: awayEdge },
    { side: "draw" as const, edge: drawEdge },
  ];

  const best = edges.reduce((a, b) => (a.edge > b.edge ? a : b));

  if (best.edge < MIN_EDGE) return "none";

  return best.side;
}

export async function runMatchAnalysis(
  match: PolymarketMatch,
  category: "football" | "esports",
  locale: string = "en"
): Promise<MatchAnalysisWithEdge> {
  const aiResult = await analyzeMatch(match, category, locale);

  const homeEdge = calculateEdge(aiResult.home_win_probability, match.odds.homeWin, category);
  const awayEdge = calculateEdge(aiResult.away_win_probability, match.odds.awayWin, category);

  let bestEdge = Math.max(homeEdge, awayEdge);
  if (aiResult.draw_probability && match.odds.draw) {
    const drawEdge = calculateEdge(aiResult.draw_probability, match.odds.draw, category);
    bestEdge = Math.max(bestEdge, drawEdge);
  }

  const recommendedSide = determineRecommendedSide(
    aiResult.home_win_probability,
    aiResult.away_win_probability,
    aiResult.draw_probability,
    match.odds,
    aiResult.confidence
  );

  const result: MatchAnalysisWithEdge = {
    matchId: match.event.id,
    category,
    homeTeam: match.homeTeam,
    awayTeam: match.awayTeam,
    homeWinProbability: aiResult.home_win_probability,
    awayWinProbability: aiResult.away_win_probability,
    drawProbability: aiResult.draw_probability,
    confidence: aiResult.confidence,
    keyFactors: aiResult.key_factors,
    reasoning: aiResult.reasoning,
    goalDifferenceAnalysis: aiResult.goal_difference_analysis
      ? {
          predictedGoalDiff: aiResult.goal_difference_analysis.predicted_goal_diff,
          overUnderGoals: aiResult.goal_difference_analysis.over_under_goals,
        }
      : undefined,
    mapAnalysis: aiResult.map_analysis
      ? {
          predictedMaps: aiResult.map_analysis.predicted_maps,
        }
      : undefined,
    marketOdds: match.odds,
    edgePercent: bestEdge,
    recommendedSide,
  };

  return result;
}
