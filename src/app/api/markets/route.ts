import { NextRequest, NextResponse } from "next/server";
import {
  getTodayGames,
  getTomorrowGames,
  areTodayGamesFinished,
} from "@/lib/nba-data";
import {
  getNBASeasonMarkets,
  buildTeamOddsMap,
  enrichGamesWithOdds,
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

  // If user's local date is ahead of ET date, the NBA "today" is user's "yesterday"
  // but the games are still "current" — label them with ET date for clarity
  const userIsAhead = userDateStr > etDateStr;

  let todayLabel: string;
  let tomorrowLabel: string;

  if (userIsAhead) {
    // User's timezone is ahead (e.g., Asia/Shanghai), NBA "today" may already be user's "tomorrow"
    todayLabel = `ET ${etDisplay}`;
    // Calculate ET tomorrow date
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

    // Always fetch today, tomorrow, and season markets in parallel
    const [todayGames, tomorrowGames, seasonMarkets] = await Promise.all([
      getTodayGames(),
      getTomorrowGames(),
      getNBASeasonMarkets(),
    ]);

    const oddsMap = buildTeamOddsMap(seasonMarkets);
    const todayWithOdds = enrichGamesWithOdds(todayGames, oddsMap);
    const tomorrowWithOdds = enrichGamesWithOdds(tomorrowGames, oddsMap);
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
