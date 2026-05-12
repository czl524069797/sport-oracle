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

function formatETDate(): string {
  const etDate = new Date().toLocaleDateString("en-US", {
    timeZone: "America/New_York",
    month: "numeric",
    day: "numeric",
  });
  return etDate;
}

function buildLabels(userTz: string, allFinished: boolean) {
  const etDateStr = getDateInTimezone("America/New_York");
  const userDateStr = getDateInTimezone(userTz);
  const etDisplay = formatETDate();

  const userIsAhead = userDateStr > etDateStr;

  let todayLabel: string;
  let tomorrowLabel: string;

  if (userIsAhead) {
    todayLabel = `ET ${etDisplay}`;
    const etTomorrow = new Date();
    etTomorrow.setDate(etTomorrow.getDate() + 1);
    const etTomorrowDisplay = etTomorrow.toLocaleDateString("en-US", {
      timeZone: "America/New_York",
      month: "numeric",
      day: "numeric",
    });
    tomorrowLabel = `ET ${etTomorrowDisplay}`;
  } else {
    todayLabel = "";
    tomorrowLabel = "";
  }

  return { todayLabel, tomorrowLabel };
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

    const labels = buildLabels(userTz, allTodayFinished);

    return NextResponse.json({
      success: true,
      data: {
        today: todayWithOdds,
        tomorrow: tomorrowWithOdds,
        allTodayFinished,
        labels,
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
