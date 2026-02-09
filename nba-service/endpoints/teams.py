from fastapi import APIRouter, HTTPException
from nba_api.stats.endpoints import (
    teamdashboardbygeneralsplits,
    teamgamelog,
    leaguegamefinder,
)
from nba_api.stats.static import teams as nba_teams
from services.cache import timed_cache
from typing import Any

router = APIRouter()


@timed_cache(seconds=600)
def _get_team_stats(team_id: int) -> dict[str, Any]:
    """Fetch team dashboard stats."""
    try:
        dashboard = teamdashboardbygeneralsplits.TeamDashboardByGeneralSplits(
            team_id=team_id,
            season="2025-26",
            season_type_all_star="Regular Season",
        )
        data = dashboard.get_normalized_dict()
        overall = data.get("OverallTeamDashboard", [{}])[0]

        # Get game log for last 10 games
        game_log = teamgamelog.TeamGameLog(
            team_id=team_id,
            season="2025-26",
        )
        log_data = game_log.get_normalized_dict()
        games = log_data.get("TeamGameLog", [])[:10]
        wins_last10 = sum(1 for g in games if g.get("WL") == "W")
        losses_last10 = len(games) - wins_last10

        # Calculate home/away records from game log
        all_games = log_data.get("TeamGameLog", [])
        home_games = [g for g in all_games if "vs." in g.get("MATCHUP", "")]
        away_games = [g for g in all_games if "@" in g.get("MATCHUP", "")]
        home_wins = sum(1 for g in home_games if g.get("WL") == "W")
        away_wins = sum(1 for g in away_games if g.get("WL") == "W")

        team_info = None
        for t in nba_teams.get_teams():
            if t["id"] == team_id:
                team_info = t
                break

        return {
            "teamId": team_id,
            "teamName": team_info["full_name"] if team_info else str(team_id),
            "last10Record": f"{wins_last10}-{losses_last10}",
            "homeRecord": f"{home_wins}-{len(home_games) - home_wins}",
            "awayRecord": f"{away_wins}-{len(away_games) - away_wins}",
            "offensiveRating": overall.get("OFF_RATING", 0),
            "defensiveRating": overall.get("DEF_RATING", 0),
            "netRating": overall.get("NET_RATING", 0),
            "pace": overall.get("PACE", 0),
            "pointsPerGame": overall.get("PTS", 0) / max(overall.get("GP", 1), 1),
            "opponentPointsPerGame": overall.get("OPP_PTS", 0) / max(overall.get("GP", 1), 1) if overall.get("OPP_PTS") else 0,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch team stats: {e}")


@router.get("/{team_id}/stats")
async def team_stats(team_id: int):
    """Get team statistics."""
    return _get_team_stats(team_id)


@timed_cache(seconds=600)
def _get_head_to_head(home_id: int, away_id: int) -> dict[str, Any]:
    """Get head-to-head record between two teams this season."""
    try:
        finder = leaguegamefinder.LeagueGameFinder(
            team_id_nullable=home_id,
            season_nullable="2025-26",
            season_type_nullable="Regular Season",
        )
        data = finder.get_normalized_dict()
        all_games = data.get("LeagueGameFinderResults", [])

        # Find games against the opponent
        away_team = None
        for t in nba_teams.get_teams():
            if t["id"] == away_id:
                away_team = t
                break

        if not away_team:
            return {"homeWins": 0, "awayWins": 0, "games": []}

        h2h_games = []
        home_wins = 0
        away_wins = 0

        for g in all_games:
            matchup = g.get("MATCHUP", "")
            if away_team["abbreviation"] in matchup:
                won = g.get("WL") == "W"
                is_home = "vs." in matchup

                if is_home:
                    if won:
                        home_wins += 1
                    else:
                        away_wins += 1
                else:
                    if won:
                        away_wins += 1
                    else:
                        home_wins += 1

                h2h_games.append({
                    "date": g.get("GAME_DATE", ""),
                    "homeScore": g.get("PTS", 0) if is_home else 0,
                    "awayScore": 0 if is_home else g.get("PTS", 0),
                    "winner": "home" if (is_home and won) or (not is_home and not won) else "away",
                })

        return {
            "homeWins": home_wins,
            "awayWins": away_wins,
            "games": h2h_games[:5],
        }
    except Exception:
        return {"homeWins": 0, "awayWins": 0, "games": []}


@router.get("/h2h")
async def head_to_head(home: int, away: int):
    """Get head-to-head record between two teams."""
    return _get_head_to_head(home, away)
