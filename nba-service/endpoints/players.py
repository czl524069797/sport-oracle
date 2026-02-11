from fastapi import APIRouter, HTTPException
from nba_api.stats.endpoints import teamplayerdashboard
from services.cache import timed_cache
from typing import Any, Dict, List

router = APIRouter()


@timed_cache(seconds=600)
def _get_team_players(team_id: int) -> List[Dict[str, Any]]:
    """Fetch team player statistics."""
    try:
        dashboard = teamplayerdashboard.TeamPlayerDashboard(
            team_id=team_id,
            season="2025-26",
            season_type_all_star="Regular Season",
        )
        data = dashboard.get_normalized_dict()
        players_data = data.get("PlayersSeasonTotals", [])

        players = []
        for p in players_data:
            gp = max(p.get("GP", 1), 1)
            players.append({
                "playerId": p.get("PLAYER_ID", 0),
                "playerName": p.get("PLAYER_NAME", "Unknown"),
                "position": p.get("PLAYER_POSITION", ""),
                "pointsPerGame": round(p.get("PTS", 0) / gp, 1),
                "assistsPerGame": round(p.get("AST", 0) / gp, 1),
                "reboundsPerGame": round(p.get("REB", 0) / gp, 1),
                "minutesPerGame": round(p.get("MIN", 0) / gp, 1),
                "isInjured": False,  # nba_api doesn't provide injury data directly
                "injuryStatus": None,
            })

        # Sort by minutes played (most active players first)
        players.sort(key=lambda x: x["minutesPerGame"], reverse=True)
        return players

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch players: {e}",
        )


@router.get("/{team_id}/players")
async def team_players_route(team_id: int):
    """Alias route for team players (also accessible via /api/teams/{id}/players)."""
    players = _get_team_players(team_id)
    return {"players": players}
