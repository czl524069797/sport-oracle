import { NextResponse } from "next/server";
import {
  getNBASeasonMarkets,
  buildTeamOddsMap,
  enrichGamesWithAllOdds,
  getUpcomingNBAGamesWithOdds,
} from "@/lib/polymarket";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    // Use ESPN's scoreboard as the schedule authority, then attach the closest
    // Polymarket single-game market for odds and market links.
    const [seasonMarkets, nbaGameData] = await Promise.all([
      getNBASeasonMarkets(),
      getUpcomingNBAGamesWithOdds(),
    ]);

    const oddsMap = buildTeamOddsMap(seasonMarkets);
    const upcomingWithOdds = enrichGamesWithAllOdds(nbaGameData.games, oddsMap, nbaGameData.oddsMap);

    return NextResponse.json({
      success: true,
      data: {
        today: upcomingWithOdds,
        tomorrow: [],
        allTodayFinished: false,
        labels: {
          todayLabel: "",
          tomorrowLabel: "",
        },
      },
    });
  } catch (error) {
    console.error("[/api/markets] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to fetch markets",
      },
      { status: 500 }
    );
  }
}
