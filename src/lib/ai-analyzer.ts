import type {
  AIAnalysisInput,
  AIAnalysisResult,
  AnalysisWithEdge,
  GameWithOdds,
} from "@/types";
import { analyzeGame } from "./openai";
import {
  getTeamStats,
  getTeamPlayers,
  getHeadToHead,
} from "./nba-data";
import { prisma } from "./db";

/**
 * Remove bookmaker vig from implied probabilities.
 * If home implied = 0.54, away implied = 0.50 → total = 1.04 → vig = 0.04
 * Adjusted: home = 0.54/1.04 ≈ 0.519, away = 0.50/1.04 ≈ 0.481
 */
function removeVig(homeImplied: number, awayImplied: number): { home: number; away: number } {
  const total = homeImplied + awayImplied;
  if (total <= 0) return { home: 0.5, away: 0.5 };
  return {
    home: homeImplied / total,
    away: awayImplied / total,
  };
}

/**
 * Calculate edge: AI probability minus vig-adjusted market implied probability.
 * Positive edge = AI thinks the team is undervalued by the market.
 */
function calculateNBAEdge(
  aiHomeProb: number,
  aiAwayProb: number,
  marketHomeProb: number,
  marketAwayProb: number
): { homeEdge: number; awayEdge: number; bestSide: "home" | "away" | "none"; bestEdge: number } {
  const adjusted = removeVig(marketHomeProb, marketAwayProb);

  const homeEdge = aiHomeProb - adjusted.home;
  const awayEdge = aiAwayProb - adjusted.away;

  const MIN_EDGE = 0.05; // 5% minimum edge threshold

  if (homeEdge >= awayEdge && homeEdge >= MIN_EDGE) {
    return { homeEdge, awayEdge, bestSide: "home", bestEdge: homeEdge };
  }
  if (awayEdge > homeEdge && awayEdge >= MIN_EDGE) {
    return { homeEdge, awayEdge, bestSide: "away", bestEdge: awayEdge };
  }

  return { homeEdge, awayEdge, bestSide: "none", bestEdge: Math.max(homeEdge, awayEdge) };
}

/**
 * Normalize AI probabilities to sum to 1.0.
 * AI sometimes returns home=0.55 + away=0.55 = 1.10 — we fix this.
 */
function normalizeProbabilities(result: AIAnalysisResult): AIAnalysisResult {
  const total = result.homeWinProbability + result.awayWinProbability;
  if (total <= 0 || Math.abs(total - 1.0) < 0.01) return result;

  return {
    ...result,
    homeWinProbability: result.homeWinProbability / total,
    awayWinProbability: result.awayWinProbability / total,
  };
}

/**
 * Validate AI output ranges. Clamp to valid bounds rather than throwing.
 */
function validateAndClamp(result: AIAnalysisResult): AIAnalysisResult {
  const clamp = (v: number, min: number, max: number) => Math.min(Math.max(v, min), max);

  return {
    ...result,
    homeWinProbability: clamp(result.homeWinProbability, 0, 1),
    awayWinProbability: clamp(result.awayWinProbability, 0, 1),
    confidence: clamp(result.confidence, 0, 1),
    spreadAnalysis: {
      ...result.spreadAnalysis,
      spreadConfidence: clamp(result.spreadAnalysis.spreadConfidence, 0, 1),
    },
    totalPointsAnalysis: {
      ...result.totalPointsAnalysis,
      overProbability: clamp(result.totalPointsAnalysis.overProbability, 0, 1),
      underProbability: clamp(result.totalPointsAnalysis.underProbability, 0, 1),
      ouConfidence: clamp(result.totalPointsAnalysis.ouConfidence, 0, 1),
    },
  };
}

export async function runAnalysis(
  gameWithOdds: GameWithOdds,
  locale: string = "en"
): Promise<AnalysisWithEdge> {
  const { game, homeOdds, awayOdds, gameOdds } = gameWithOdds;

  // Prefer single-game moneyline odds; fall back to championship odds
  const hasGameOdds = gameOdds && (gameOdds.moneylineHome > 0 || gameOdds.moneylineAway > 0);

  const marketHomeProb = hasGameOdds ? gameOdds!.moneylineHome : homeOdds.championshipPrice;
  const marketAwayProb = hasGameOdds ? gameOdds!.moneylineAway : awayOdds.championshipPrice;

  // Format market prices for the AI prompt
  const homeDisplay = hasGameOdds
    ? `${(marketHomeProb * 100).toFixed(1)}% (game moneyline)`
    : `${(marketHomeProb * 100).toFixed(1)}% (season championship)`;
  const awayDisplay = hasGameOdds
    ? `${(marketAwayProb * 100).toFixed(1)}% (game moneyline)`
    : `${(marketAwayProb * 100).toFixed(1)}% (season championship)`;

  // Fetch all NBA data in parallel
  const [homeStats, awayStats, homePlayers, awayPlayers, h2h] =
    await Promise.all([
      getTeamStats(game.homeTeam.teamId),
      getTeamStats(game.awayTeam.teamId),
      getTeamPlayers(game.homeTeam.teamId),
      getTeamPlayers(game.awayTeam.teamId),
      getHeadToHead(game.homeTeam.teamId, game.awayTeam.teamId),
    ]);

  const analysisInput: AIAnalysisInput = {
    game,
    homeStats,
    awayStats,
    homePlayers,
    awayPlayers,
    headToHead: h2h,
    marketPrice: {
      home: homeDisplay,
      away: awayDisplay,
    },
  };

  // Call AI engine → validate → normalize
  const rawResult = await analyzeGame(analysisInput, locale);
  const clamped = validateAndClamp(rawResult);
  const aiResult = normalizeProbabilities(clamped);

  // Calculate edge using game-level odds when available
  const edgeCalc = hasGameOdds
    ? calculateNBAEdge(aiResult.homeWinProbability, aiResult.awayWinProbability, marketHomeProb, marketAwayProb)
    : { homeEdge: 0, awayEdge: 0, bestSide: "none" as const, bestEdge: 0 };

  // Determine recommended outcome for Polymarket
  const recommendedOutcome = edgeCalc.bestSide === "home" ? "YES" : edgeCalc.bestSide === "away" ? "NO" : "YES";

  // Use game market IDs when available, fallback to season
  const marketId = homeOdds.championshipMarketId || awayOdds.championshipMarketId || game.gameId;
  const conditionId = game.gameId;

  // Determine token ID from game odds if available
  const tokenId = "";

  const result: AnalysisWithEdge = {
    ...aiResult,
    marketId,
    conditionId,
    homeTeam: game.homeTeam.teamName,
    awayTeam: game.awayTeam.teamName,
    gameDate: game.gameDate,
    marketPrice: marketHomeProb,
    edgePercent: Math.round(edgeCalc.bestEdge * 100) / 100,
    recommendedSide: edgeCalc.bestSide,
    recommendedOutcome,
    tokenId,
  };

  // Persist to database
  await prisma.analysis.create({
    data: {
      marketId,
      conditionId,
      homeTeam: game.homeTeam.teamName,
      awayTeam: game.awayTeam.teamName,
      gameDate: new Date(game.gameDate),
      homeWinProb: aiResult.homeWinProbability,
      awayWinProb: aiResult.awayWinProbability,
      confidence: aiResult.confidence,
      reasoning: JSON.stringify({
        reasoning: aiResult.reasoning,
        keyFactors: aiResult.keyFactors,
        spreadAnalysis: aiResult.spreadAnalysis,
        totalPointsAnalysis: aiResult.totalPointsAnalysis,
        newsHighlights: aiResult.newsHighlights,
      }),
      nbaData: JSON.stringify({
        homeStats,
        awayStats,
        headToHead: h2h,
        marketHomeProb,
        marketAwayProb,
        hasGameOdds,
      }),
      marketPrice: marketHomeProb,
      edgePercent: Math.round(edgeCalc.bestEdge * 100) / 100,
    },
  });

  return result;
}
