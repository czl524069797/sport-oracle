from nba_api.stats.endpoints import scoreboardv2, leaguestandingsv3
from nba_api.stats.static import teams as nba_teams
from datetime import datetime, timedelta
from services.cache import timed_cache
from typing import Any, Dict, List, Optional


def _current_season() -> str:
    """Return NBA season string like '2025-26' based on current date."""
    now = datetime.now()
    year = now.year if now.month >= 10 else now.year - 1
    return f"{year}-{str(year + 1)[-2:]}"


@timed_cache(seconds=3600)
def _get_standings_map() -> Dict[int, Dict[str, str]]:
    """Get current season standings as a teamId -> {record, home, road} map."""
    try:
        standings = leaguestandingsv3.LeagueStandingsV3(
            season=_current_season(),
            season_type="Regular Season",
        )
        data = standings.get_normalized_dict()
        rows = data.get("Standings", [])
        result: Dict[int, Dict[str, str]] = {}
        for row in rows:
            team_id = row.get("TeamID", 0)
            wins = row.get("WINS", 0)
            losses = row.get("LOSSES", 0)
            result[team_id] = {
                "record": f"{wins}-{losses}",
                "home": row.get("HOME", ""),
                "road": row.get("ROAD", ""),
            }
        return result
    except Exception:
        return {}


def _get_team_records(team_id: int, standings: Dict[int, Dict[str, str]]) -> Dict[str, str]:
    """Get team records from standings map."""
    return standings.get(team_id, {"record": "", "home": "", "road": ""})


@timed_cache(seconds=300)
def get_today_scoreboard() -> List[Dict[str, Any]]:
    """Get today's NBA games from the scoreboard."""
    today = datetime.now().strftime("%Y-%m-%d")
    try:
        sb = scoreboardv2.ScoreboardV2(game_date=today)
        games_data = sb.get_normalized_dict()
        game_header = games_data.get("GameHeader", [])
    except Exception:
        game_header = []

    standings = _get_standings_map()

    games = []
    for g in game_header:
        home_id = g.get("HOME_TEAM_ID", 0)
        away_id = g.get("VISITOR_TEAM_ID", 0)
        home_team = find_team_by_id(home_id)
        away_team = find_team_by_id(away_id)
        if not home_team or not away_team:
            continue

        # Try GameHeader wins/losses first; fall back to standings
        home_w = g.get("HOME_TEAM_WINS", 0)
        home_l = g.get("HOME_TEAM_LOSSES", 0)
        away_w = g.get("VISITOR_TEAM_WINS", 0)
        away_l = g.get("VISITOR_TEAM_LOSSES", 0)

        home_recs = _get_team_records(home_id, standings)
        away_recs = _get_team_records(away_id, standings)

        home_record = f"{home_w}-{home_l}" if (home_w + home_l) > 0 else home_recs["record"]
        away_record = f"{away_w}-{away_l}" if (away_w + away_l) > 0 else away_recs["record"]

        games.append({
            "gameId": g.get("GAME_ID", ""),
            "gameDate": g.get("GAME_DATE_EST", today),
            "homeTeam": {
                "teamId": home_id,
                "teamName": home_team["full_name"],
                "teamAbbreviation": home_team["abbreviation"],
                "record": home_record,
                "homeRecord": home_recs.get("home", ""),
                "awayRecord": home_recs.get("road", ""),
            },
            "awayTeam": {
                "teamId": away_id,
                "teamName": away_team["full_name"],
                "teamAbbreviation": away_team["abbreviation"],
                "record": away_record,
                "homeRecord": away_recs.get("home", ""),
                "awayRecord": away_recs.get("road", ""),
            },
            "status": g.get("GAME_STATUS_TEXT", ""),
        })

    return games


def find_team_by_id(team_id: int) -> Optional[Dict[str, Any]]:
    """Find NBA team by ID."""
    all_teams = nba_teams.get_teams()
    for team in all_teams:
        if team["id"] == team_id:
            return team
    return None


@timed_cache(seconds=300)
def get_upcoming_games(days: int = 7) -> List[Dict[str, Any]]:
    """Get upcoming games for the next N days."""
    standings = _get_standings_map()
    all_games = []
    for i in range(days):
        date = (datetime.now() + timedelta(days=i)).strftime("%Y-%m-%d")
        try:
            sb = scoreboardv2.ScoreboardV2(game_date=date)
            games_data = sb.get_normalized_dict()
            game_header = games_data.get("GameHeader", [])
            for g in game_header:
                home_id = g.get("HOME_TEAM_ID", 0)
                away_id = g.get("VISITOR_TEAM_ID", 0)
                home_team = find_team_by_id(home_id)
                away_team = find_team_by_id(away_id)
                if not home_team or not away_team:
                    continue
                home_recs = _get_team_records(home_id, standings)
                away_recs = _get_team_records(away_id, standings)
                all_games.append({
                    "gameId": g.get("GAME_ID", ""),
                    "gameDate": date,
                    "homeTeam": {
                        "teamId": home_id,
                        "teamName": home_team["full_name"],
                        "teamAbbreviation": home_team["abbreviation"],
                        "record": home_recs.get("record", ""),
                        "homeRecord": home_recs.get("home", ""),
                        "awayRecord": home_recs.get("road", ""),
                    },
                    "awayTeam": {
                        "teamId": away_id,
                        "teamName": away_team["full_name"],
                        "teamAbbreviation": away_team["abbreviation"],
                        "record": away_recs.get("record", ""),
                        "homeRecord": away_recs.get("home", ""),
                        "awayRecord": away_recs.get("road", ""),
                    },
                    "status": g.get("GAME_STATUS_TEXT", ""),
                })
        except Exception:
            continue
    return all_games
