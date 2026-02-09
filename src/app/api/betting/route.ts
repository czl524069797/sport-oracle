import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { placeBet } from "@/lib/bet-executor";
import { z } from "zod";

const PK_USER_WALLET = "pk-user";

const betSchema = z.object({
  walletAddress: z.string().min(1).optional(),
  analysisId: z.string().min(1),
  tokenId: z.string().min(1),
  side: z.enum(["BUY", "SELL"]),
  outcome: z.enum(["YES", "NO"]),
  amount: z.number().positive().max(1000),
  price: z.number().min(0.01).max(0.99),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = betSchema.parse(body);

    const hasPrivateKey = !!process.env.POLYMARKET_PRIVATE_KEY;

    // Determine wallet address: use provided or fallback to pk-user if private key mode
    const walletAddress = validated.walletAddress ?? (hasPrivateKey ? PK_USER_WALLET : null);

    if (!walletAddress) {
      return NextResponse.json(
        { success: false, error: "Wallet address required" },
        { status: 400 }
      );
    }

    // Find or create user
    let user = await prisma.user.findUnique({
      where: { walletAddress },
    });

    if (!user) {
      user = await prisma.user.create({
        data: { walletAddress },
      });
    }

    // Check daily budget from active strategy
    const strategy = await prisma.strategy.findFirst({
      where: { userId: user.id, isActive: true },
    });

    if (strategy && validated.amount > strategy.maxBetAmount) {
      return NextResponse.json(
        { success: false, error: `Amount exceeds max bet of $${strategy.maxBetAmount}` },
        { status: 400 }
      );
    }

    const result = await placeBet(user.id, {
      analysisId: validated.analysisId,
      tokenId: validated.tokenId,
      side: validated.side,
      outcome: validated.outcome,
      amount: validated.amount,
      price: validated.price,
    });

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: error.errors.map((e) => e.message).join(", ") },
        { status: 400 }
      );
    }
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Bet placement failed",
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const walletAddress = searchParams.get("wallet");

    if (!walletAddress) {
      return NextResponse.json(
        { success: false, error: "wallet address required" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { walletAddress },
    });

    if (!user) {
      return NextResponse.json({ success: true, data: [] });
    }

    const bets = await prisma.bet.findMany({
      where: { userId: user.id },
      include: {
        analysis: {
          select: {
            homeTeam: true,
            awayTeam: true,
            gameDate: true,
            homeWinProb: true,
            awayWinProb: true,
            confidence: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, data: bets });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to fetch bets",
      },
      { status: 500 }
    );
  }
}
