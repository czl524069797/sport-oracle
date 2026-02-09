import type {
  AIAnalysisInput,
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

export async function runAnalysis(
  gameWithOdds: GameWithOdds,
  locale: string = "en"
): Promise<AnalysisWithEdge> {
  const { game, homeOdds, awayOdds } = gameWithOdds;

  // Use championship prices as proxy for team strength market signal
  const homePrice = homeOdds.championshipPrice;
  const awayPrice = awayOdds.championshipPrice;

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
      home: homePrice,
      away: awayPrice,
    },
  };

  // Call AI engine
  const aiResult = await analyzeGame(analysisInput, locale);

  // Use championship market IDs for reference
  const marketId = homeOdds.championshipMarketId || awayOdds.championshipMarketId || game.gameId;
  const conditionId = game.gameId;

  const result: AnalysisWithEdge = {
    ...aiResult,
    marketId,
    conditionId,
    homeTeam: game.homeTeam.teamName,
    awayTeam: game.awayTeam.teamName,
    gameDate: game.gameDate,
    marketPrice: homePrice,
    edgePercent: 0,
    recommendedSide: "none",
    recommendedOutcome: "YES",
    tokenId: "",
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
      nbaData: JSON.stringify(analysisInput),
      marketPrice: result.marketPrice,
      edgePercent: 0,
    },
  });

  return result;
}
