import { NextRequest, NextResponse } from "next/server";
import type { ApiResponse, MatchAnalysisWithEdge, PolymarketMatch } from "@/types";
import { runMatchAnalysis } from "@/lib/match-ai-analyzer";

interface MatchAnalysisRequest {
  match: PolymarketMatch;
  category: "football" | "esports";
  locale?: string;
}

export async function POST(req: NextRequest) {
  try {
    const body: MatchAnalysisRequest = await req.json();

    if (!body.match) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: "Match data is required" },
        { status: 400 }
      );
    }

    if (!body.category || !["football", "esports"].includes(body.category)) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: "Valid category (football/esports) is required" },
        { status: 400 }
      );
    }

    const locale = body.locale ?? "en";

    const analysis = await runMatchAnalysis(body.match, body.category, locale);

    return NextResponse.json<ApiResponse<MatchAnalysisWithEdge>>({
      success: true,
      data: analysis,
    });
  } catch (error) {
    console.error("[match-analysis] Error:", error);
    return NextResponse.json<ApiResponse<null>>(
      {
        success: false,
        error: error instanceof Error ? error.message : "Analysis failed",
      },
      { status: 500 }
    );
  }
}
