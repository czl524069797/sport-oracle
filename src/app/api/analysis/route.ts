import { NextRequest, NextResponse } from "next/server";
import {
  getNBASeasonMarkets,
  buildTeamOddsMap,
  enrichGamesWithAllOdds,
  getUpcomingNBAGamesWithOdds,
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

    // Keep analysis aligned with /api/markets: Polymarket NBA single-game markets are
    // the primary source for game ids, matchups, URLs, and game-level odds.
    const [seasonMarkets, nbaGameData] = await Promise.all([
      getNBASeasonMarkets(),
      getUpcomingNBAGamesWithOdds(),
    ]);

    const oddsMap = buildTeamOddsMap(seasonMarkets);
    const gamesWithOdds = enrichGamesWithAllOdds(nbaGameData.games, oddsMap, nbaGameData.oddsMap);

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
