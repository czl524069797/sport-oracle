from fastapi import APIRouter
from services.nba_client import get_today_scoreboard, get_upcoming_games

router = APIRouter()


@router.get("/today")
async def today_schedule():
    """Get today's NBA games."""
    games = get_today_scoreboard()
    return {"games": games, "count": len(games)}


@router.get("/upcoming")
async def upcoming_schedule(days: int = 7):
    """Get upcoming NBA games for the next N days."""
    games = get_upcoming_games(days)
    return {"games": games, "count": len(games)}
