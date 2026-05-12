import { NextRequest, NextResponse } from "next/server";
import {
  areTodayGamesFinished,
} from "@/lib/nba-data";
import {
  getNBASeasonMarkets,
  buildTeamOddsMap,
  enrichGamesWithAllOdds,
  getUpcomingNBAGamesWithOdds,
} from "@/lib/polymarket";
import type { NBAGame } from "@/types";

export const dynamic = "force-dynamic";

function getDateInTimezone(tz: string, date: Date = new Date()): string {
  try {
    return date.toLocaleDateString("en-CA", { timeZone: tz });
  } catch {
    return date.toLocaleDateString("en-CA");
  }
}

function splitGamesByDate(games: NBAGame[], userTz: string) {
  const todayStr = getDateInTimezone(userTz);
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = getDateInTimezone(userTz, tomorrow);

  return {
    todayGames: games.filter((game) => getDateInTimezone(userTz, new Date(game.gameDate)) === todayStr),
    tomorrowGames: games.filter((game) => getDateInTimezone(userTz, new Date(game.gameDate)) === tomorrowStr),
  };
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userTz = searchParams.get("tz") ?? "America/New_York";

    // Use Polymarket NBA-tagged single-game markets as the primary source so matchups
    // and odds come from the same market data surface.
    const [seasonMarkets, nbaGameData] = await Promise.all([
      getNBASeasonMarkets(),
      getUpcomingNBAGamesWithOdds(),
    ]);
    const { todayGames, tomorrowGames } = splitGamesByDate(nbaGameData.games, userTz);

    const oddsMap = buildTeamOddsMap(seasonMarkets);
    const todayWithOdds = enrichGamesWithAllOdds(todayGames, oddsMap, nbaGameData.oddsMap);
    const tomorrowWithOdds = enrichGamesWithAllOdds(tomorrowGames, oddsMap, nbaGameData.oddsMap);
    const allTodayFinished = areTodayGamesFinished(todayGames);

    return NextResponse.json({
      success: true,
      data: {
        today: todayWithOdds,
        tomorrow: tomorrowWithOdds,
        allTodayFinished,
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
