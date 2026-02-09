import { prisma } from "./db";
import { getTodayGames } from "./nba-data";
import { getNBASeasonMarkets, buildTeamOddsMap, enrichGamesWithOdds } from "./polymarket";
import { runAnalysis } from "./ai-analyzer";
import { shouldBet, calculateBetAmount, placeBet, getDailySpent } from "./bet-executor";
import type { AnalysisWithEdge, StrategyConfig } from "@/types";

export async function scanAndAnalyze(): Promise<AnalysisWithEdge[]> {
  // 1. Get today's NBA games
  const games = await getTodayGames();
  if (games.length === 0) return [];

  // 2. Get season markets and build odds map
  const seasonMarkets = await getNBASeasonMarkets();
  const oddsMap = buildTeamOddsMap(seasonMarkets);

  // 3. Enrich games with odds
  const gamesWithOdds = enrichGamesWithOdds(games, oddsMap);

  // 4. Run AI analysis for each game
  const results: AnalysisWithEdge[] = [];
  for (const gameWithOdds of gamesWithOdds) {
    try {
      const analysis = await runAnalysis(gameWithOdds);
      results.push(analysis);
    } catch (error) {
      console.error(
        `Analysis failed for ${gameWithOdds.game.homeTeam.teamName} vs ${gameWithOdds.game.awayTeam.teamName}:`,
        error
      );
    }
  }

  return results;
}

export async function executeAutoStrategy(
  userId: string
): Promise<{ executed: number; skipped: number }> {
  // Get user's active auto-execute strategies
  const strategies = await prisma.strategy.findMany({
    where: {
      userId,
      isActive: true,
      autoExecute: true,
    },
  });

  if (strategies.length === 0) {
    return { executed: 0, skipped: 0 };
  }

  const analyses = await scanAndAnalyze();
  const dailySpent = await getDailySpent(userId);

  let executed = 0;
  let skipped = 0;

  for (const analysis of analyses) {
    // Use the first matching strategy
    const strategy: StrategyConfig = strategies[0];

    if (!shouldBet(analysis, strategy)) {
      skipped++;
      continue;
    }

    const amount = calculateBetAmount(analysis, strategy, dailySpent);
    if (amount <= 0) {
      skipped++;
      continue;
    }

    try {
      // Get the analysis record from DB
      const dbAnalysis = await prisma.analysis.findFirst({
        where: { marketId: analysis.marketId },
        orderBy: { createdAt: "desc" },
      });

      if (!dbAnalysis) {
        skipped++;
        continue;
      }

      await placeBet(userId, {
        analysisId: dbAnalysis.id,
        tokenId: analysis.tokenId,
        side: "BUY",
        outcome: analysis.recommendedOutcome,
        amount,
        price: analysis.marketPrice,
      });
      executed++;
    } catch (error) {
      console.error("Auto bet execution failed:", error);
      skipped++;
    }
  }

  return { executed, skipped };
}
