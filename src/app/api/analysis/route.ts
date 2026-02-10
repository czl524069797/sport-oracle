import { NextRequest, NextResponse } from "next/server";
import { getTodayGames, getTomorrowGames } from "@/lib/nba-data";
import {
  getNBASeasonMarkets,
  buildTeamOddsMap,
  enrichGamesWithOdds,
} from "@/lib/polymarket";
import { runAnalysis } from "@/lib/ai-analyzer";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { gameId, locale } = body;

    if (!gameId) {
      return NextResponse.json(
        { success: false, error: "gameId is required" },
        { status: 400 }
      );
    }

    // Get games and season markets
    const [todayGames, tomorrowGames, seasonMarkets] = await Promise.all([
      getTodayGames(),
      getTomorrowGames(),
      getNBASeasonMarkets(),
    ]);

    const allGames = [...todayGames, ...tomorrowGames];
    const oddsMap = buildTeamOddsMap(seasonMarkets);
    const gamesWithOdds = enrichGamesWithOdds(allGames, oddsMap);

    const target = gamesWithOdds.find((g) => g.game.gameId === gameId);

    if (!target) {
      return NextResponse.json(
        { success: false, error: "Game not found" },
        { status: 404 }
      );
    }

    const analysis = await runAnalysis(target, locale ?? "en");

    return NextResponse.json({
      success: true,
      data: analysis,
    });
  } catch (error) {
    console.error("[/api/analysis] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Analysis failed",
      },
      { status: 500 }
    );
  }
}
