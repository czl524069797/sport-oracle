import requests
from datetime import datetime, timedelta
from services.cache import timed_cache
from typing import Any, Dict, List

NBA_SCHEDULE_URL = "https://cdn.nba.com/static/json/staticData/scheduleLeagueV2_1.json"


def _parse_schedule_date(raw: str) -> datetime:
    return datetime.strptime(raw, "%m/%d/%Y %H:%M:%S")


@timed_cache(seconds=3600)
def _fetch_league_schedule() -> Dict[str, Any]:
    resp = requests.get(NBA_SCHEDULE_URL, timeout=20)
    resp.raise_for_status()
    return resp.json()["leagueSchedule"]


@timed_cache(seconds=3600)
def _get_game_dates() -> List[Dict[str, Any]]:
    return _fetch_league_schedule().get("gameDates", [])


@timed_cache(seconds=3600)
def _build_team_index() -> Dict[int, Dict[str, str]]:
    teams: Dict[int, Dict[str, str]] = {}
    for gd in _get_game_dates():
        games = gd.get("games", [])
        for g in games:
            for side in ["homeTeam", "awayTeam"]:
                t = g.get(side) or {}
                team_id = int(t.get("teamId", 0))
                if not team_id or team_id in teams:
                    continue
                teams[team_id] = {
                    "teamName": t.get("teamName", ""),
                    "teamCity": t.get("teamCity", ""),
                    "teamTricode": t.get("teamTricode", ""),
                }
    return teams


def _format_team_name(meta: Dict[str, str]) -> str:
    city = meta.get("teamCity", "").strip()
    name = meta.get("teamName", "").strip()
    if city and name:
        return f"{city} {name}"
    return name or city or "Unknown"


@timed_cache(seconds=300)
def get_today_scoreboard() -> List[Dict[str, Any]]:
    today = datetime.utcnow().date()
    games: List[Dict[str, Any]] = []
    teams = _build_team_index()
    for gd in _get_game_dates():
        raw_date = gd.get("gameDate")
        if not raw_date:
            continue
        try:
            date = _parse_schedule_date(raw_date).date()
        except Exception:
            continue
        if date != today:
            continue
        game_date_str = date.strftime("%Y-%m-%d")
        for g in gd.get("games", []):
            home = g.get("homeTeam", {})
            away = g.get("awayTeam", {})
            home_id = int(home.get("teamId", 0) or 0)
            away_id = int(away.get("teamId", 0) or 0)
            home_meta = teams.get(home_id, {})
            away_meta = teams.get(away_id, {})
            games.append(
                {
                    "gameId": g.get("gameId", ""),
                    "gameDate": game_date_str,
                    "homeTeam": {
                        "teamId": home_id,
                        "teamName": _format_team_name(home_meta),
                        "teamAbbreviation": home_meta.get("teamTricode", home.get("teamTricode", "")),
                        "record": f"{home.get('wins', 0)}-{home.get('losses', 0)}",
                        "homeRecord": "",
                        "awayRecord": "",
                    },
                    "awayTeam": {
                        "teamId": away_id,
                        "teamName": _format_team_name(away_meta),
                        "teamAbbreviation": away_meta.get("teamTricode", away.get("teamTricode", "")),
                        "record": f"{away.get('wins', 0)}-{away.get('losses', 0)}",
                        "homeRecord": "",
                        "awayRecord": "",
                    },
                    "status": g.get("gameStatusText", ""),
                }
            )
    return games


@timed_cache(seconds=300)
def get_upcoming_games(days: int = 7) -> List[Dict[str, Any]]:
    today = datetime.utcnow().date()
    end_date = today + timedelta(days=days - 1)
    games: List[Dict[str, Any]] = []
    teams = _build_team_index()
    for gd in _get_game_dates():
        raw_date = gd.get("gameDate")
        if not raw_date:
            continue
        try:
            date = _parse_schedule_date(raw_date).date()
        except Exception:
            continue
        if date < today or date > end_date:
            continue
        game_date_str = date.strftime("%Y-%m-%d")
        for g in gd.get("games", []):
            home = g.get("homeTeam", {})
            away = g.get("awayTeam", {})
            home_id = int(home.get("teamId", 0) or 0)
            away_id = int(away.get("teamId", 0) or 0)
            home_meta = teams.get(home_id, {})
            away_meta = teams.get(away_id, {})
            games.append(
                {
                    "gameId": g.get("gameId", ""),
                    "gameDate": game_date_str,
                    "homeTeam": {
                        "teamId": home_id,
                        "teamName": _format_team_name(home_meta),
                        "teamAbbreviation": home_meta.get("teamTricode", home.get("teamTricode", "")),
                        "record": f"{home.get('wins', 0)}-{home.get('losses', 0)}",
                        "homeRecord": "",
                        "awayRecord": "",
                    },
                    "awayTeam": {
                        "teamId": away_id,
                        "teamName": _format_team_name(away_meta),
                        "teamAbbreviation": away_meta.get("teamTricode", away.get("teamTricode", "")),
                        "record": f"{away.get('wins', 0)}-{away.get('losses', 0)}",
                        "homeRecord": "",
                        "awayRecord": "",
                    },
                    "status": g.get("gameStatusText", ""),
                }
            )
    return games
