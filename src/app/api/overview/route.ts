import { NextRequest, NextResponse } from "next/server";
import { getNBAOverview, getFootballOverview, getEsportsOverview } from "@/lib/polymarket-overview";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category") ?? "nba";

    let markets;
    switch (category) {
      case "football":
        markets = await getFootballOverview();
        break;
      case "esports":
        markets = await getEsportsOverview();
        break;
      default:
        markets = await getNBAOverview();
    }

    return NextResponse.json({ success: true, data: { category, markets } });
  } catch (error) {
    console.error("[/api/overview] Error:", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Failed to fetch overview" },
      { status: 500 }
    );
  }
}
