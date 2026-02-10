import { NextResponse } from "next/server";
import { getFootballMatchesAndEvents } from "@/lib/polymarket-events";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { matches, events } = await getFootballMatchesAndEvents(20);
    return NextResponse.json({ success: true, data: { matches, events } });
  } catch (error) {
    console.error("[/api/football] Error:", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Failed to fetch football events" },
      { status: 500 }
    );
  }
}
