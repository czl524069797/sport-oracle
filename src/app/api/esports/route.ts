import { NextRequest, NextResponse } from "next/server";
import { getEsportsMatchesAndEvents } from "@/lib/polymarket-events";
import type { EsportsGameKey } from "@/types";

export const dynamic = "force-dynamic";

const ESPORTS_GAMES = new Set<EsportsGameKey>(["lol", "cs2", "valorant"]);

function parseGame(value: string | null): EsportsGameKey {
  return ESPORTS_GAMES.has(value as EsportsGameKey) ? (value as EsportsGameKey) : "lol";
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const game = parseGame(searchParams.get("game"));
    const { matches, events } = await getEsportsMatchesAndEvents(20, game);
    return NextResponse.json({ success: true, data: { matches, events, game } });
  } catch (error) {
    console.error("[/api/esports] Error:", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Failed to fetch esports events" },
      { status: 500 }
    );
  }
}
