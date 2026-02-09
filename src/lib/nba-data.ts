import type { NBAGame, TeamStats, PlayerStats, HeadToHead } from "@/types";

const NBA_SERVICE_URL =
  process.env.NBA_SERVICE_URL ?? "http://localhost:8000";

export async function getTodayGames(): Promise<NBAGame[]> {
  try {
    const res = await fetch(`${NBA_SERVICE_URL}/api/schedule/today`, {
      next: { revalidate: 300 },
    });
    if (!res.ok) {
      console.error(`[nba-data] getTodayGames failed: ${res.status}`);
      return [];
    }
    const data = await res.json();
    return data.games ?? [];
  } catch (error) {
    console.error("[nba-data] getTodayGames connection error:", error instanceof Error ? error.message : error);
    return [];
  }
}

export async function getTomorrowGames(): Promise<NBAGame[]> {
  try {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateStr = tomorrow.toISOString().split("T")[0];
    const res = await fetch(
      `${NBA_SERVICE_URL}/api/schedule/upcoming?days=2`,
      { next: { revalidate: 600 } }
    );
    if (!res.ok) {
      console.error(`[nba-data] getTomorrowGames failed: ${res.status}`);
      return [];
    }
    const data = await res.json();
    const games: NBAGame[] = data.games ?? [];
    return games.filter((g) => g.gameDate === dateStr);
  } catch (error) {
    console.error("[nba-data] getTomorrowGames connection error:", error instanceof Error ? error.message : error);
    return [];
  }
}

export function areTodayGamesFinished(games: NBAGame[]): boolean {
  if (games.length === 0) return false;
  return games.every((g) => {
    const status = g.status.toLowerCase().trim();
    return status === "final" || status.startsWith("final/");
  });
}

const EMPTY_TEAM_STATS: TeamStats = {
  teamId: 0,
  teamName: "Unknown",
  last10Record: "0-0",
  homeRecord: "0-0",
  awayRecord: "0-0",
  offensiveRating: 0,
  defensiveRating: 0,
  netRating: 0,
  pace: 0,
  pointsPerGame: 0,
  opponentPointsPerGame: 0,
};

const EMPTY_H2H: HeadToHead = {
  homeWins: 0,
  awayWins: 0,
  games: [],
};

export async function getTeamStats(teamId: number): Promise<TeamStats> {
  try {
    const res = await fetch(`${NBA_SERVICE_URL}/api/teams/${teamId}/stats`);
    if (!res.ok) {
      console.error(`[nba-data] getTeamStats(${teamId}) failed: ${res.status}`);
      return { ...EMPTY_TEAM_STATS, teamId };
    }
    return res.json();
  } catch (error) {
    console.error(`[nba-data] getTeamStats(${teamId}) connection error:`, error instanceof Error ? error.message : error);
    return { ...EMPTY_TEAM_STATS, teamId };
  }
}

export async function getTeamPlayers(
  teamId: number
): Promise<PlayerStats[]> {
  try {
    const res = await fetch(`${NBA_SERVICE_URL}/api/players/${teamId}/players`);
    if (!res.ok) {
      console.error(`[nba-data] getTeamPlayers(${teamId}) failed: ${res.status}`);
      return [];
    }
    const data = await res.json();
    return data.players ?? [];
  } catch (error) {
    console.error(`[nba-data] getTeamPlayers(${teamId}) connection error:`, error instanceof Error ? error.message : error);
    return [];
  }
}

export async function getHeadToHead(
  homeTeamId: number,
  awayTeamId: number
): Promise<HeadToHead> {
  try {
    const res = await fetch(
      `${NBA_SERVICE_URL}/api/teams/h2h?home=${homeTeamId}&away=${awayTeamId}`
    );
    if (!res.ok) {
      console.error(`[nba-data] getHeadToHead(${homeTeamId}, ${awayTeamId}) failed: ${res.status}`);
      return { ...EMPTY_H2H };
    }
    return res.json();
  } catch (error) {
    console.error(`[nba-data] getHeadToHead connection error:`, error instanceof Error ? error.message : error);
    return { ...EMPTY_H2H };
  }
}
