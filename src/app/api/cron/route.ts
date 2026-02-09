import { NextRequest, NextResponse } from "next/server";
import { scanAndAnalyze, executeAutoStrategy } from "@/lib/strategy-engine";
import { prisma } from "@/lib/db";

// Cron endpoint - triggered by node-cron or external scheduler
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const action = (body as { action?: string }).action ?? "scan";

    if (action === "scan") {
      const analyses = await scanAndAnalyze();
      return NextResponse.json({
        success: true,
        data: {
          action: "scan",
          analyzed: analyses.length,
          withEdge: analyses.filter((a) => a.edgePercent > 0.05).length,
        },
      });
    }

    if (action === "auto-execute") {
      const walletAddress = (body as { walletAddress?: string }).walletAddress;
      if (!walletAddress) {
        return NextResponse.json(
          { success: false, error: "walletAddress required for auto-execute" },
          { status: 400 }
        );
      }

      const user = await prisma.user.findUnique({
        where: { walletAddress },
      });

      if (!user) {
        return NextResponse.json(
          { success: false, error: "User not found" },
          { status: 404 }
        );
      }

      const result = await executeAutoStrategy(user.id);
      return NextResponse.json({ success: true, data: result });
    }

    return NextResponse.json(
      { success: false, error: "Unknown action" },
      { status: 400 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Cron execution failed",
      },
      { status: 500 }
    );
  }
}
