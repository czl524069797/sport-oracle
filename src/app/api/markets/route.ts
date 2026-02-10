import { NextRequest, NextResponse } from "next/server";
import {
  getTodayGames,
  getTomorrowGames,
  areTodayGamesFinished,
} from "@/lib/nba-data";
import {
  getNBASeasonMarkets,
  buildTeamOddsMap,
  enrichGamesWithAllOdds,
  getNBAGameMarkets,
} from "@/lib/polymarket";

function getDateInTimezone(tz: string): string {
  try {
    return new Date().toLocaleDateString("en-CA", { timeZone: tz });
  } catch {
    return new Date().toLocaleDateString("en-CA");
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

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userTz = searchParams.get("tz") ?? "America/New_York";

    // Fetch all data in parallel: today games, tomorrow games, season markets, single-game markets
    const [todayGames, tomorrowGames, seasonMarkets, gameOddsMap] = await Promise.all([
      getTodayGames(),
      getTomorrowGames(),
      getNBASeasonMarkets(),
      getNBAGameMarkets(),
    ]);

    const oddsMap = buildTeamOddsMap(seasonMarkets);
    const todayWithOdds = enrichGamesWithAllOdds(todayGames, oddsMap, gameOddsMap);
    const tomorrowWithOdds = enrichGamesWithAllOdds(tomorrowGames, oddsMap, gameOddsMap);
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
