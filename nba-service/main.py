from dotenv import load_dotenv
import os

# Load .env.local from parent directory
env_path = os.path.join(os.path.dirname(__file__), "..", ".env.local")
load_dotenv(env_path)

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from endpoints.schedule import router as schedule_router
from endpoints.teams import router as teams_router
from endpoints.players import router as players_router
from endpoints.trading import router as trading_router

app = FastAPI(
    title="NBA Data Service",
    description="NBA statistics data service for prediction analysis",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(schedule_router, prefix="/api/schedule", tags=["Schedule"])
app.include_router(teams_router, prefix="/api/teams", tags=["Teams"])
app.include_router(players_router, prefix="/api/players", tags=["Players"])
app.include_router(trading_router, prefix="/api/trading", tags=["Trading"])


@app.get("/health")
async def health_check():
    return {"status": "ok"}
