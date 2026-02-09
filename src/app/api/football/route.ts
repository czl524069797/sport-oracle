import { NextResponse } from "next/server";
import { getFootballEvents } from "@/lib/polymarket-events";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const events = await getFootballEvents(10);
    return NextResponse.json({ success: true, data: { events } });
  } catch (error) {
    console.error("[/api/football] Error:", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Failed to fetch football events" },
      { status: 500 }
    );
  }
}
