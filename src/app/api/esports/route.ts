import { NextResponse } from "next/server";
import { getEsportsEvents } from "@/lib/polymarket-events";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const events = await getEsportsEvents(10);
    return NextResponse.json({ success: true, data: { events } });
  } catch (error) {
    console.error("[/api/esports] Error:", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Failed to fetch esports events" },
      { status: 500 }
    );
  }
}
